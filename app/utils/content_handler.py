import json
import hashlib
from .logger import log_error, log_info

def get_content_hash(content):
    """İçeriğin hash değerini hesaplar"""
    try:
        # İçeriği sıralı bir şekilde string'e çevir
        if isinstance(content, (dict, list)):
            # Önce içeriği normalize et
            normalized_content = normalize_content(content)
            content_str = json.dumps(normalized_content, sort_keys=True)
        else:
            content_str = str(content)
        # String'i byte'a çevir ve hash'le
        return hashlib.md5(content_str.encode('utf-8')).hexdigest()
    except Exception as e:
        log_error(f"Hash hesaplama hatası: {str(e)}")
        return None

def normalize_content(content):
    """İçeriği normalize eder, gereksiz alanları temizler"""
    if isinstance(content, list):
        return [normalize_content(item) for item in content]
    elif isinstance(content, dict):
        # Sadece önemli alanları tut
        important_fields = ['name', 'type', 'path', 'size', 'contents']
        return {k: normalize_content(v) for k, v in content.items() if k in important_fields}
    return content
