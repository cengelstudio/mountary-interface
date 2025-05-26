from colorama import init, Fore, Style

# Initialize colorama
init()

def log_error(error_message):
    """Renkli hata mesajı yazdırır"""
    print(f"{Fore.RED}[HATA] {error_message}{Style.RESET_ALL}")

def log_info(message):
    """Renkli bilgi mesajı yazdırır"""
    print(f"{Fore.BLUE}[BİLGİ] {message}{Style.RESET_ALL}")
