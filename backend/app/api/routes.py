from flask import Blueprint, request, jsonify
from ..utils.logger import log_error, log_info
from ..utils.file_ops import ensure_disk_directory, load_json_file, save_json_file, create_snapshot
from ..utils.content_handler import get_content_hash
import os

api = Blueprint('api', __name__)

@api.route('/get_disk_data', methods=['POST'])
def get_disk_data():
    try:
        data = request.get_json()
        log_info(f"Gelen JSON verisi: {data}")

        # Gerekli alanların kontrolü
        required_fields = ['disk_info', 'system_info', 'timestamp', 'contents']
        if not all(field in data for field in required_fields):
            error_msg = "Eksik alanlar var. Gerekli alanlar: disk_info, system_info, timestamp, contents"
            log_error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 400

        disk_id = data['disk_info'].get('disk_id')
        if not disk_id:
            error_msg = "disk_id bulunamadı"
            log_error(error_msg)
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 400

        # Disk dizin yapısını oluştur
        disk_path = ensure_disk_directory(disk_id)

        # Mevcut dosyaları yükle
        contents_file = os.path.join(disk_path, 'contents.json')
        devices_file = os.path.join(disk_path, 'devices.json')
        disk_file = os.path.join(disk_path, 'disk.json')

        current_data = load_json_file(contents_file)
        devices = load_json_file(devices_file)
        disk_info = load_json_file(disk_file)

        # İçerik değişikliği kontrolü
        new_content_hash = get_content_hash(data['contents'])
        current_content_hash = get_content_hash(current_data.get('contents', []))

        # İçerik varsa ve değişiklik varsa veya ilk kez kaydediliyorsa
        if data['contents'] and (not current_data.get('contents') or new_content_hash != current_content_hash):
            # Eski içeriği snapshot olarak kaydet
            create_snapshot(disk_path, current_data)

            # Yeni içeriği kaydet
            new_data = {
                "contents": data['contents']
            }
            save_json_file(contents_file, new_data)
            log_info(f"İçerik güncellendi. İçerik boyutu: {len(data['contents'])} öğe")

        # Cihaz bilgisini güncelle
        system_info = data['system_info']
        if not isinstance(devices, list):
            devices = []
        if system_info not in devices:
            devices.insert(0, system_info)  # Yeni cihazı listenin başına ekle
            save_json_file(devices_file, devices)
            log_info("Cihaz bilgisi güncellendi")

        # Disk bilgilerini güncelle
        if not isinstance(disk_info, dict):
            disk_info = {}
        disk_info.update({
            'disk_id': disk_id,
            'last_update': data['timestamp'],
            'last_device': system_info,
            'disk_details': {
                'device': data['disk_info'].get('device'),
                'mountpoint': data['disk_info'].get('mountpoint'),
                'fstype': data['disk_info'].get('fstype'),
                'total_size': data['disk_info'].get('total_size'),
                'used': data['disk_info'].get('used'),
                'free': data['disk_info'].get('free'),
                'percent': data['disk_info'].get('percent'),
                'label': data['disk_info'].get('label'),
                'serial': data['disk_info'].get('serial')
            }
        })
        save_json_file(disk_file, disk_info)
        log_info("Disk bilgileri güncellendi")

        return jsonify({
            "status": "success",
            "message": "Disk verisi başarıyla güncellendi",
            "disk_id": disk_id,
            "content_updated": new_content_hash != current_content_hash if new_content_hash and current_content_hash else True
        }), 200

    except Exception as e:
        error_msg = f"Hata oluştu: {str(e)}"
        log_error(error_msg)
        return jsonify({"status": "error", "message": str(e)}), 400
