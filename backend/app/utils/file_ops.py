import json
import os
from datetime import datetime
from .logger import log_info

def ensure_disk_directory(disk_id):
    """Disk için gerekli dizin yapısını oluşturur"""
    disk_path = os.path.join('data', disk_id)
    snapshots_path = os.path.join(disk_path, 'snapshots')

    for path in [disk_path, snapshots_path]:
        if not os.path.exists(path):
            os.makedirs(path)

    return disk_path

def load_json_file(file_path):
    """JSON dosyasını yükler, yoksa boş dict döner"""
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Eğer data bir liste ise, eski format, yeni formata çevir
            if isinstance(data, list):
                return {}
            return data
    return {}

def save_json_file(file_path, data):
    """JSON dosyasına veri kaydeder"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def create_snapshot(disk_path, current_data):
    """Mevcut veriyi snapshot olarak kaydeder"""
    if current_data.get('contents'):
        snapshot_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        snapshot_file = os.path.join(disk_path, 'snapshots', f'snapshot_{snapshot_time}.json')
        save_json_file(snapshot_file, current_data)
        log_info(f"Yeni snapshot oluşturuldu: {snapshot_file}")
