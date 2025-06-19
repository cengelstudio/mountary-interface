from flask import Blueprint, request, jsonify, current_app
from ..utils.logger import log_error, log_info
from ..utils.file_ops import ensure_disk_directory, load_json_file, save_json_file, create_snapshot
from ..utils.content_handler import get_content_hash
import os
import json
from app.socketio_instance import socketio
from flask_socketio import emit
import time

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
                'serial': data['disk_info'].get('serial'),
                'connected': data['disk_info'].get('connected')
            }
        })
        save_json_file(disk_file, disk_info)
        log_info("Disk bilgileri güncellendi")

        # SocketIO ile disk güncelleme event'i yayınla
        try:
            disk_summary = {
                'id': disk_info.get('disk_id', disk_id),
                'name': disk_info.get('disk_details', {}).get('label') or disk_info.get('disk_details', {}).get('device') or disk_id,
                'totalSpace': disk_info.get('disk_details', {}).get('total_size', 0),
                'usedSpace': disk_info.get('disk_details', {}).get('used', 0),
                'lastUpdated': disk_info.get('last_update', ''),
                'isActive': bool(disk_info.get('disk_details', {}).get('mountpoint')),
                'connected': disk_info.get('disk_details', {}).get('connected', None)
            }
            socketio.emit('disk_update', disk_summary)
        except Exception as e:
            log_error(f"SocketIO emit hatası: {e}")

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

@api.route('/disks', methods=['GET'])
def list_disks():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data')
    data_dir = os.path.abspath(data_dir)
    disks = []
    if os.path.exists(data_dir):
        for disk_id in os.listdir(data_dir):
            disk_path = os.path.join(data_dir, disk_id)
            disk_file = os.path.join(disk_path, 'disk.json')
            if os.path.isdir(disk_path) and os.path.exists(disk_file):
                try:
                    with open(disk_file, 'r', encoding='utf-8') as f:
                        disk_info = json.load(f)
                        details = disk_info.get('disk_details', {})
                        disks.append({
                            'id': disk_info.get('disk_id', disk_id),
                            'name': details.get('label') or details.get('device') or disk_id,
                            'totalSpace': details.get('total_size', 0),
                            'usedSpace': details.get('used', 0),
                            'lastUpdated': disk_info.get('last_update', ''),
                            'isActive': bool(details.get('mountpoint')),
                            'connected': details.get('connected', None)
                        })
                except Exception as e:
                    continue
    return jsonify({'disks': disks})

@socketio.on('connect')
def handle_connect():
    import os
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data')
    data_dir = os.path.abspath(data_dir)
    disks = []
    if os.path.exists(data_dir):
        for disk_id in os.listdir(data_dir):
            disk_path = os.path.join(data_dir, disk_id)
            disk_file = os.path.join(disk_path, 'disk.json')
            if os.path.isdir(disk_path) and os.path.exists(disk_file):
                try:
                    with open(disk_file, 'r', encoding='utf-8') as f:
                        disk_info = json.load(f)
                        details = disk_info.get('disk_details', {})
                        disks.append({
                            'id': disk_info.get('disk_id', disk_id),
                            'name': details.get('label') or details.get('device') or disk_id,
                            'totalSpace': details.get('total_size', 0),
                            'usedSpace': details.get('used', 0),
                            'lastUpdated': disk_info.get('last_update', ''),
                            'isActive': bool(details.get('mountpoint')),
                            'connected': details.get('connected', None)
                        })
                except Exception as e:
                    continue
    socketio.emit('all_disks', disks)

@socketio.on('get_disk_stats')
def handle_get_disk_stats(disk_id):
    import os
    disk_path = os.path.join('data', disk_id)
    disk_file = os.path.join(disk_path, 'disk.json')
    contents_file = os.path.join(disk_path, 'contents.json')

    # Disk bilgileri
    disk_info = {}
    if os.path.exists(disk_file):
        with open(disk_file, 'r', encoding='utf-8') as f:
            disk_info = json.load(f)
    details = disk_info.get('disk_details', {})

    # Dosya/klasör içerikleri
    contents = []
    if os.path.exists(contents_file):
        with open(contents_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            contents = data.get('contents', [])

    # İstatistikler
    def count_items(items, parent_path=''):
        file_count = 0
        dir_count = 0
        for item in items:
            current_path = os.path.join(parent_path, item.get('name', ''))
            if item.get('type') == 'file':
                file_count += 1
            elif item.get('type') == 'directory':
                dir_count += 1
                if 'contents' in item:
                    sub_files, sub_dirs = count_items(item['contents'], current_path)
                    file_count += sub_files
                    dir_count += sub_dirs
        return file_count, dir_count

    total_files, total_dirs = count_items(contents)
    largest_file = max((item for item in contents if item.get('type') == 'file'), key=lambda x: x.get('size', 0), default=None)

    # Son değiştirilen dosyayı bul ve boyut bilgisini ekle
    def find_last_modified_file(items):
        last_modified = None
        for item in items:
            if item.get('type') == 'file':
                if not last_modified or item.get('modified', '') > last_modified.get('modified', ''):
                    last_modified = {
                        'name': item.get('name'),
                        'modifiedAt': item.get('modified'),
                        'path': item.get('path', ''),
                        'size': item.get('size', 0)
                    }
            elif item.get('type') == 'directory' and 'contents' in item:
                sub_last_modified = find_last_modified_file(item['contents'])
                if sub_last_modified and (not last_modified or sub_last_modified['modifiedAt'] > last_modified.get('modified', '')):
                    last_modified = sub_last_modified
        return last_modified

    last_modified_file = find_last_modified_file(contents)

    # Dosya türleri
    file_types = {}
    def collect_file_types(items):
        for item in items:
            if item.get('type') == 'file':
                ext = os.path.splitext(item.get('name', ''))[1][1:].lower() or 'other'
                if ext not in file_types:
                    file_types[ext] = {'count': 0, 'totalSize': 0}
                file_types[ext]['count'] += 1
                file_types[ext]['totalSize'] += item.get('size', 0)
            elif item.get('type') == 'directory' and 'contents' in item:
                collect_file_types(item['contents'])

    collect_file_types(contents)

    stats = {
        'name': details.get('label') or details.get('device') or disk_id,
        'totalSpace': details.get('total_size', 0),
        'usedSpace': details.get('used', 0),
        'totalFiles': total_files,
        'totalDirectories': total_dirs,
        'lastModifiedFile': last_modified_file,
        'fileTypes': file_types,
    }
    emit('disk_stats', stats)

def normalize_path(p):
    return p.rstrip('/').lower() if p else ''

def find_dir_contents(all_items, target_path):
    for item in all_items:
        if item.get('type') == 'directory' and item.get('path') == target_path:
            return item.get('contents', [])
        if item.get('type') == 'directory' and 'contents' in item:
            found = find_dir_contents(item['contents'], target_path)
            if found is not None:
                return found
    return None

@socketio.on('get_file_system')
def handle_get_file_system(data):
    import os
    disk_id = data['diskId']
    path = data['path']
    disk_path = os.path.join('data', disk_id)
    contents_file = os.path.join(disk_path, 'contents.json')

    items = []
    if os.path.exists(contents_file):
        with open(contents_file, 'r', encoding='utf-8') as f:
            data_json = json.load(f)
            all_items = data_json.get('contents', [])
            if path == '/' or path == '':
                disk_file = os.path.join(disk_path, 'disk.json')
                mountpoint = None
                if os.path.exists(disk_file):
                    with open(disk_file, 'r', encoding='utf-8') as df:
                        disk_info = json.load(df)
                        mountpoint = disk_info.get('disk_details', {}).get('mountpoint', None)
                if mountpoint:
                    items = [
                        item for item in all_items
                        if normalize_path(os.path.dirname(item.get('path', ''))) == normalize_path(mountpoint)
                    ]
                else:
                    items = all_items
            else:
                found = find_dir_contents(all_items, path)
                if found is not None:
                    items = found
    folders = [item for item in items if item.get('type') == 'directory']
    files = sorted([item for item in items if item.get('type') == 'file'], key=lambda x: x.get('size', 0), reverse=True)
    sorted_items = folders + files
    emit('file_system_update', {'path': path, 'items': sorted_items})
