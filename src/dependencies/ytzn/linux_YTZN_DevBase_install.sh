#!/bin/bash
set -euo pipefail

case "$(uname -m)" in
    x86_64|amd64) platform=x64 ;;
    i386|i486|i586|i686) platform=x86 ;;
    *)
        echo "Unsupported CPU architecture: $(uname -m)" >&2
        exit 1
        ;;
esac

if [ "$(id -u)" -eq 0 ]; then
    sudo_cmd=()
else
    sudo_cmd=(sudo)
fi

"${sudo_cmd[@]}" install -m 755 "Linux/Dll/${platform}/"*.so /usr/lib/
if command -v ldconfig >/dev/null 2>&1; then
    "${sudo_cmd[@]}" ldconfig
fi

echo "YTZN_DevBase debug libraries installed for ${platform}."
