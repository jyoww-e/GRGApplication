#!/bin/bash

# 自动适配 root / 普通用户环境
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

ARCH=`uname -m`

AARCH64="aarch64"
X86="i686"
X64="x86_64"

PLATFORM="lib"

INC_DIR="/usr/include/"
LIB_DIR="/usr/lib/"


unload()
{
    cd ${INC_DIR} || return
    $SUDO rm -f CString.h DevBase.h DevDriverLog.h DriverLogDef.h \
                libusbwrapper.h libusbwrapperdef.h typedef.h trace.h

    cd ${LIB_DIR} || return
    $SUDO rm -f libYTZN_DevBase*.so libYTZN_DevDriverLog*.so libUsbWrapper*.so
}

if [ $# -eq 0 ]; then
    param="on"
else 
    param=$1
fi

if [ "${param}" = "on" ]; then

    echo "--->Enter Deployment YTZN_DevBase"
    if [ "${ARCH}" = "${X86}" ]; then
        PLATFORM="x86"
    elif [ "${ARCH}" = "${X64}" ]; then
        PLATFORM="x64"
    elif [ "${ARCH}" = "${AARCH64}" ]; then
        PLATFORM="aarch64"
    else
        echo "<---Leave Deployment YTZN_DevBase, platform invalid."	
        exit 1
    fi	
        
    echo "--->[${PLATFORM}]"
    
    $SUDO cp -f ./Include/*.h ${INC_DIR}
    $SUDO cp -f ./Linux/Dll/${PLATFORM}/*.so ${LIB_DIR}

    echo "<---Leave Deployment YTZN_DevBase SUCCESS."
    
elif [ "${param}" = "off" ]; then
    echo "--->Enter Unload YTZN_DevBase."
    unload
    echo "<---Leave Unload YTZN_DevBase SUCCESS."	
else
    echo "please check your cmd, ex: [./softwareDeployment.sh on]  [./softwareDeployment.sh off]"
fi

exit 0