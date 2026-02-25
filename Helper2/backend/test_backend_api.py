#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой тест backend API для Яндекс Диска
"""

import requests
import json

def test_backend():
    print("=" * 60)
    print("Тест Backend API Яндекс Диска")
    print("=" * 60)
    print()
    
    try:
        url = "http://localhost:8000/api/yandex-disk/files"
        print(f"URL: {url}")
        print("Отправка запроса...")
        
        response = requests.get(url, timeout=10)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Success! Total files: {data.get('total', 0)}")
            print(f"Is public: {data.get('is_public', False)}")
            print(f"Public key: {data.get('public_key', 'N/A')}")
            
            files = data.get('files', [])
            if files:
                print(f"\nFirst 3 files:")
                for i, file in enumerate(files[:3], 1):
                    print(f"  {i}. {file.get('name', 'N/A')} ({file.get('size_formatted', 'N/A')})")
            else:
                print("\nNo files found")
            
            return True
        else:
            print(f"[ERROR] Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'N/A')}")
            except:
                print(f"Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Backend server is not running!")
        print("Start it with: python simple_main.py")
        return False
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_backend()
    print()
    print("=" * 60)
    if success:
        print("[OK] Test completed successfully!")
    else:
        print("[ERROR] Test failed!")
    print("=" * 60)









