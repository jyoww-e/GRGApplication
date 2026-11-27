// DevDriverLog.h
//
//////////////////////////////////////////////////////////////////////////
#ifndef __DEVDRIVERLOG_H__
#define __DEVDRIVERLOG_H__

#include <sys/types.h>
#include <iostream>

#include "typedef.h"

// 数值宏定义
#define TRACE_EXTRA_LEVEL					4
#define TRACE_INFO_LEVEL					3
#define TRACE_WARNING_LEVEL					2
#define TRACE_ERROR_LEVEL					1
#define TRACE_SYSTEM_LEVEL					0

#define DEFAULT_FREE_SPACE					200
#define DEFAULT_LOG_SIZE					0x100000
#define TRACE_AUTO_RENAME					0x01
#define TRACE_NO_ENCRYPTED					0x02
#define TRACE_DATA_TEXT						0x04
#define TRACE_NO_INTERMEDIATE_BUFFERING		0x08

#ifndef INFINITE
#define INFINITE								0xFFFFFFFF
#endif
#define MAX_DATA_LEN							4096

#define YTZN_LOG_RETURN_TRUE				1   //接口执行成功
#define YTZN_LOG_RETURN_FALSE				0	//接口执行失败
#define YTZN_LOG_RETURN_DIR_STRING_ILLEGAL	-1  //非法目录字符串
#define YTZN_LOG_RETURN_DIR_NAME_ILLEGAL	-2	//非法目录名称
#define YTZN_LOG_RETURN_DIR_LEN_TO_LONG		-3	//目录名称过长
#define YTZN_LOG_RETURN_DIR_ACCESS_DENIED	-4	//访问被拒绝
#define YTZN_LOG_RETURN_DIR_PATH_NOT_FOUND	-5	//路径不存在
#define YTZN_LOG_RETURN_DIR_FILE_NOT_FOUND	-6	//文件不存在
#define YTZN_LOG_RETURN_DIR_OTHER_ERR		-7	//其他错误
#define YTZN_LOG_RETURN_DISK_WILL_FULL		-11	//磁盘空间不足，默认在打开或创建文件时磁盘空间剩余200M报这个错
#define YTZN_LOG_RETURN_DISK_NOT_EXIST		-12	//磁盘不存在
#define YTZN_LOG_RETURN_FILE_SEEK_ERR		-21	//文件操作失败
#define YTZN_LOG_RETURN_FILE_WRITE_ERR		-22	//文件写入失败

#ifdef _WINDOWS
#ifdef YTZN_DEVDRIVERLOG_EXPORTS
#define YTZN_DEVDRIVERLOG_API __declspec(dllexport)
#else
#define YTZN_DEVDRIVERLOG_API __declspec(dllimport)
#ifdef _DEBUG
#pragma comment(lib,"YTZN_DevDriverLogD.lib")
#ifdef _WIN64
#pragma message("Automatically linking with x64 YTZN_DevDriverLog.dll (Debug)")
#else
#pragma message("Automatically linking with x86 YTZN_DevDriverLog.dll (Debug)")			
#endif
#else
#pragma comment(lib,"YTZN_DevDriverLog.lib")
#ifdef _WIN64
#pragma message("Automatically linking with x64 YTZN_DevDriverLog.dll (Release)")
#else
#pragma message("Automatically linking with x86 YTZN_DevDriverLog.dll (Release)")
#endif
#endif
#endif
#else
#define	YTZN_DEVDRIVERLOG_API  __attribute__((visibility("default")))
#endif // _WINDOWS




#ifdef __cplusplus
extern "C" {
#endif

	class YTZN_DEVDRIVERLOG_API ODevDriverLog
	{
	public:
		ODevDriverLog();
		virtual ~ODevDriverLog();

	public:
		BOOL bStratTrace();
		BOOL bStopTrace(DWORD timeout = INFINITE);
		BOOL bOpenTrace(LPCTSTR filename, DWORD level = TRACE_INFO_LEVEL, DWORD size = 10 * DEFAULT_LOG_SIZE, DWORD flags = TRACE_NO_ENCRYPTED | TRACE_DATA_TEXT);
		BOOL bCloseTrace();
		BOOL bWriteTrace(ULONG level, LPCVOID buffer, ULONG length, LPCSTR format, ...);
		BOOL bWriteMsg(ULONG level, LPCSTR format, ...);
		BOOL bSetTraceLevel(ULONG level);
		BOOL bSetTraceMode(ULONG mode = TRACE_NO_INTERMEDIATE_BUFFERING);
		BOOL bSetTraceKeepTime(ULONG nDays);
		int iGetVersion(char* p_pcVersion);

	private:
		VOID* m_pvTrace;

	};

#ifdef __cplusplus
}
#endif

#endif	// __DEVDRIVERLOG_H__
