#ifndef __DEVBASE_H__
#define __DEVBASE_H__


#include <iostream>
using namespace std;
#include <string.h>
#include <string>
#include <stdio.h>
#include <stdlib.h>

#include "grg_locker.h"
#include "DevBaseDefStruct.h"
#include "typedef.h"


#ifdef _WINDOWS
	#ifdef YTZN_DEVBASE_EXPORTS
		#define YTZN_DEVBASE_API __declspec(dllexport)
	#else
		#define YTZN_DEVBASE_API __declspec(dllimport)
		#ifdef _DEBUG
			#pragma comment(lib,"YTZN_DevBaseD.lib")
			#ifdef _WIN64
				#pragma message("Automatically linking with x64 YTZN_DevBase.dll (Debug)")
			#else
				#pragma message("Automatically linking with x86 YTZN_DevBase.dll (Debug)")			
			#endif
		#else
			#pragma comment(lib,"YTZN_DevBase.lib")
			#ifdef _WIN64
				#pragma message("Automatically linking with x64 YTZN_DevBase.dll (Release)")
			#else
				#pragma message("Automatically linking with x86 YTZN_DevBase.dll (Release)")
			#endif
		#endif
	#endif
#else
	#define	YTZN_DEVBASE_API  __attribute__((visibility("default")))
#endif // _WINDOWS




/**
 * @class YTZN_ODevBase
 * @brief Cross-platform device driver base class
 * 
 * This class provides unified interfaces for device communication, supporting:
 * - Serial port (COM) communication
 * - USB communication
 * - Configuration file management
 * - Logging functionality
 */
class YTZN_DEVBASE_API YTZN_ODevBase
{
public:
	/** @brief Constructor */
	YTZN_ODevBase();
	/** @brief Virtual destructor */
	virtual ~YTZN_ODevBase();


	/**
	 * @brief Set the logical device name
	 * @param p_pcLogicalDevName The logical device name to set
	 */
	void vSetLogicalDevName(const char* p_pcLogicalDevName);

	/**
	 * @brief Get the logical device name
	 * @param p_pcLogicalDevName Output buffer for the device name
	 */
	void vGetLogicalDevName(char* p_pcLogicalDevName);


	/**
	 * @brief Initialize device and load configuration
	 * @param p_bIsExePath If true, read config from exe directory; if false, read from devbase library directory
	 * @return SUCCESS on success, error code on failure
	 * 
	 * @note This function loads the GRGDTATM_CommCfg.ini configuration file.
	 * In OpenHarmony, if p_bIsExePath is false, it means /data/app/sxd/dunite/, 
	 * and if p_bIsExePath is true, it means to load the configuration file in the process directory to meet the needs of users in different scenarios.
     * In Android, default /sdcard/dunite/ loads the configuration file.
	 */
	int iPreInitDev(bool p_bIsExePath = true);

	/**
	 * @brief Get default communication configuration (COM/Serial)
	 * @param p_sCommCfg Output configuration structure
	 * @return SUCCESS on success, error code on failure
	 */
	int iGetDefaultCommConfig(tCommCfg& p_sCommCfg);

	/**
	 * @brief Get default communication configuration (USB)
	 * @param p_sCommCfg Output configuration structure
	 * @return SUCCESS on success, error code on failure
	 */
	int iGetDefaultCommConfig2(tCommCfg2& p_sCommCfg);


	/**
	 * @brief Initialize communication (COM/Serial)
	 * @param p_sCommCfg Communication configuration
	 * @param p_bEnableEvents Enable event-based communication
	 * @return SUCCESS on success, error code on failure
	 */
	int iInitComm(tCommCfg p_sCommCfg, bool p_bEnableEvents = false);

	/**
	 * @brief Initialize communication (USB)
	 * @param p_sCommCfg Communication configuration
	 * @param p_bEnableEvents Enable event-based communication
	 * @return SUCCESS on success, error code on failure
	 */
	int iInitComm2(tCommCfg2 p_sCommCfg, bool p_bEnableEvents = false);


	/**
	 * @brief Send command via COM/Serial port
	 * @param p_pbySendCmd Command data buffer
	 * @param p_uiCmdLength Command data length
	 * @param p_bClearRecvBuf Clear receive buffer before sending
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int iSendCommand(const BYTE* p_pbySendCmd, UINT p_uiCmdLength, bool p_bClearRecvBuf = true, bool p_bLog = true);

	/**
	 * @brief Wait for response from COM/Serial port
	 * @param p_pbyDataRecv Receive buffer
	 * @param p_uiRecvLength On input: buffer size; On output: actual data length
	 * @param p_uiTimeout Timeout in milliseconds
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int iWaitResult(BYTE* p_pbyDataRecv, UINT& p_uiRecvLength, UINT p_uiTimeout, bool p_bLog = true);

	/**
	 * @brief Send command and wait for response (COM/Serial)
	 * @param p_pbySendCmd Command data buffer
	 * @param p_uiCmdLength Command data length
	 * @param p_pbyDataRecv Receive buffer
	 * @param p_uiRecvLength On input: buffer size; On output: actual data length
	 * @param p_uiTimeout Timeout in milliseconds
	 * @param p_bClearRecvBuf Clear receive buffer before sending
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int	iSendAndRecvData(
		const BYTE* p_pbySendCmd,
		UINT p_uiCmdLength,
		BYTE* p_pbyDataRecv,
		UINT& p_uiRecvLength,
		UINT p_uiTimeout,
		bool p_bClearRecvBuf = true,
		bool p_bLog = true
	);

	/**
	 * @brief Send command via USB
	 * @param p_pbySendCmd Command data buffer
	 * @param p_uiCmdLength Command data length
	 * @param p_shSendPipe USB send pipe number
	 * @param p_bClearRecvBuf Clear receive buffer before sending
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int iSendCommand2(
		const BYTE* p_pbySendCmd,
		UINT p_uiCmdLength,
		short p_shSendPipe,
		bool p_bClearRecvBuf = true,
		bool p_bLog = true
	);

	/**
	 * @brief Wait for response from USB
	 * @param p_pbyDataRecv Receive buffer
	 * @param p_uiRecvLength On input: buffer size; On output: actual data length
	 * @param p_uiTimeout Timeout in milliseconds
	 * @param p_shRecvPipe USB receive pipe number
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int iWaitResult2(
		BYTE* p_pbyDataRecv,
		UINT& p_uiRecvLength,
		UINT p_uiTimeout,
		short p_shRecvPipe,
		bool p_bLog = true
	);


	/**
	 * @brief Wait for multiple responses from USB
	 * @param p_pbyDataRecv Receive buffer
	 * @param p_uiRecvLength On input: buffer size; On output: actual data length
	 * @param p_uiTimeout Timeout in milliseconds
	 * @param p_shRecvPipe USB receive pipe number
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int iWaitnResult2(
		BYTE* p_pbyDataRecv,
		UINT& p_uiRecvLength,
		UINT p_uiTimeout,
		short p_shRecvPipe,
		bool p_bLog = true
	);


	/**
	 * @brief Send command and wait for response (USB)
	 * @param p_pbySendCmd Command data buffer
	 * @param p_uiCmdLength Command data length
	 * @param p_pbyDataRecv Receive buffer
	 * @param p_uiRecvLength On input: buffer size; On output: actual data length
	 * @param p_uiTimeout Timeout in milliseconds
	 * @param p_shSendPipe USB send pipe number
	 * @param p_shRecvPipe USB receive pipe number
	 * @param p_bClearRecvBuf Clear receive buffer before sending
	 * @param p_bLog Enable logging
	 * @return SUCCESS on success, error code on failure
	 */
	int	iSendAndRecvData2(
		const BYTE* p_pbySendCmd,
		UINT p_uiCmdLength,
		BYTE* p_pbyDataRecv,
		UINT& p_uiRecvLength,
		UINT p_uiTimeout,
		short p_shSendPipe,
		short p_shRecvPipe,
		bool p_bClearRecvBuf = true,
		bool p_bLog = true
	);


	/**
	 * @brief Clear USB receive buffer
	 * @param p_shPipe Pipe number, -1 means clear all pipes
	 */
	void vClearRecvBuf2(short p_shPipe = -1);


	/**
	 * @brief Close COM/Serial port communication
	 * @return SUCCESS on success, error code on failure
	 */
	int iCloseComm();


	/**
	 * @brief Close USB communication
	 * @return SUCCESS on success, error code on failure
	 */
	int iCloseComm2();

	/**
	 * @brief Write log message
	 * @param p_pcData Log data buffer
	 * @param p_uiLen Data length (0 means null-terminated string)
	 * @param p_iInfoCatalog Log catalog level
	 * @param p_iMSGType Message type
	 * @param p_bBinaryData Treat data as binary if true
	 * @return SUCCESS on success, error code on failure
	 */
	int	iWriteLog(
		char* p_pcData,
		UINT p_uiLen = 0,
		int	p_iInfoCatalog = GATALOG_NOTE,
		int p_iMSGType = MSG_GENERAL,
		bool p_bBinaryData = false
	);

	/**
	 * @brief Get hardware error flag
	 * @return Error flag value
	 */
	int			iGetErrorFlag();							
	/**
	 * @brief Get hardware error structure
	 * @return Error structure
	 */
	tDevReturn	tGetErrorFlag();	
	/**
	 * @brief Set hardware error flag
	 * @param p_iFlag Error flag value
	 */
	void		vSetErrorFlag(const int p_iFlag);			
	/**
	 * @brief Set hardware error structure
	 * @param p_sDevErr Error structure
	 */
	void		vSetErrorFlag(const tDevReturn p_sDevErr);


	/**
	 * @brief Get software version string
	 * @param p_pcVersion Output buffer for version string
	 * @return SUCCESS on success, error code on failure
	 */
	int	iGetVersion(char* p_pcVersion);		
	/**
	 * @brief Get hardware version string
	 * @param p_pcVersion Output buffer for version string
	 * @return SUCCESS on success, error code on failure
	 */
	int	iGetDevVersion(char* p_pcVersion);	


	/**
	 * @brief Get device status
	 * @param p_sDevReturn Output status structure
	 * @return SUCCESS
	 */
	int	iGetStatus(tDevReturn* p_sDevReturn)
	{
		return SUCCESS;
	};
	/**
	 * @brief Initialize device
	 * @param p_sDevReturn Output status structure
	 * @return SUCCESS
	 */
	int	iInit(tDevReturn* p_sDevReturn)
	{
		return SUCCESS;
	};
	/**
	 * @brief Test device
	 * @param p_sDevReturn Output status structure
	 * @return SUCCESS
	 */
	int	iTest(tDevReturn* p_sDevReturn)
	{
		return SUCCESS;
	};


	/**
	 * @brief Get integer configuration value
	 * @param p_pcSection INI file section name
	 * @param p_pcKeyName Key name
	 * @param p_iKeyValue Output integer value
	 * @return SUCCESS on success, error code on failure
	 */
	int iGetIntValue(const char* p_pcSection, const char* p_pcKeyName, int& p_iKeyValue);
	/**
	 * @brief Get string configuration value
	 * @param p_pcSection INI file section name
	 * @param p_pcKeyName Key name
	 * @param p_pcKeyValue Output string buffer
	 * @param p_uiLength On input: buffer size; On output: actual string length
	 * @return SUCCESS on success, error code on failure
	 */
	int iGetStringValue(const char* p_pcSection, const char* p_pcKeyName, char* p_pcKeyValue, UINT& p_uiLength);


	/**
	 * @brief Set integer configuration value
	 * @param p_pcSection INI file section name
	 * @param p_pcKeyName Key name
	 * @param p_lKeyValue Integer value to set
	 * @return SUCCESS on success, error code on failure
	 */
	int iSetIntValue(const char* p_pcSection, const char* p_pcKeyName, long p_lKeyValue);
	/**
	 * @brief Set string configuration value
	 * @param p_pcSection INI file section name
	 * @param p_pcKeyName Key name
	 * @param p_pcKeyValue String value to set
	 * @param p_uiLength String length
	 * @return SUCCESS on success, error code on failure
	 */
	int iSetStringValue(const char* p_pcSection, const char* p_pcKeyName, char* p_pcKeyValue, UINT p_uiLength);


	/**
	 * @brief Get system tick count
	 * @return Tick count in milliseconds
	 */
	DWORD dwGetTickCount();
	/**
	 * @brief Delay execution
	 * @param p_iMillisecond Delay duration in milliseconds
	 */
	void vDelay(int p_iMillisecond);

	virtual void vReserved1();
	virtual void vReserved2();
	virtual void vReserved3();
	virtual void vReserved4();

private:
	CTraceCLocker* m_opLock;  // Thread lock for thread-safe operations
	void* m_opImpl;           // Private implementation pointer (pimpl pattern)

};

#endif // __DEVBASE_H__

