#ifndef BR08_PRO_DEV_H_
#define BR08_PRO_DEV_H_
/**
* @file BR08ProDev.h
* @brief BR08ProDev dynamic library public C API header.
* @author GRG. GRG Intelligent Technology Solution Co.,Ltd.
* @date 2026.07.27 initial
*/
#include <stdint.h>
#include "typedef.h"
#include "DevBaseDefStruct.h"
#include "BR08ProDevDef.h"
#include "BR08ProDevStruct.h"

#if defined(_WINDOWS)
	#define BR08_PRO_CALL __cdecl
	#ifdef BR08_PRO_EXPORTS
		#define BR08_PRO_API __declspec(dllexport)
	#else
		#define BR08_PRO_API __declspec(dllimport)
		#ifdef _DEBUG
			#pragma comment(lib,"BR08ProDevD.lib")
			#ifdef _WIN64
				#pragma message("Automatically linking with x64 BR08ProDevD.dll (Debug)")
			#else
				#pragma message("Automatically linking with x86 BR08ProDevD.dll (Debug)")
			#endif
		#else
			#pragma comment(lib,"BR08ProDev.lib")
			#ifdef _WIN64
				#pragma message("Automatically linking with x64 BR08ProDev.dll (Release)")
			#else
				#pragma message("Automatically linking with x86 BR08ProDev.dll (Release)")
			#endif
		#endif
	#endif
#else
	#define BR08_PRO_CALL
	#define	BR08_PRO_API __attribute__((visibility("default")))
#endif /* defined(_WINDOWS) */



#if defined(__cplusplus)
extern "C" {
#endif
	/********************************************************************
	*  @name   Br08Pro_hOpenLogicalDevice
	 *  @brief   Open a logical device and obtain a device handle.
	 *  @param   [in]  p_pcLogicalDevName  Logical device name, matched against the
	 *                                    logical name configured in the INI file.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  Device handle used as the p_hDevHandle argument of all subsequent
	 *           APIs. Returns NULL on failure.
	*******************************************************************/
	HANDLE BR08_PRO_API BR08_PRO_CALL Br08Pro_hOpenLogicalDevice(const char* p_pcLogicalDevName, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_vCloseLogicalDevice
	 *  @brief   Close the logical device and release the handle and related resources.
	 *  @param   [in] p_hDevHandle  Device handle obtained from Br08Pro_hOpenLogicalDevice.
	 *  @return  None.
	 *******************************************************************/
	void BR08_PRO_API BR08_PRO_CALL Br08Pro_vCloseLogicalDevice(HANDLE p_hDevHandle);

	/********************************************************************
	 *  @name   Br08Pro_iSetCommPara
	 *  @brief   Configure the device communication parameters.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSetCommPara(HANDLE p_hDevHandle, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iCloseComm
	 *  @brief   Close the device communication link.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails, 
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *  
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iCloseComm(HANDLE p_hDevHandle, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_vGetDllVersion
	 *  @brief   Get the DLL version string.
	 *  @param   [in]  p_hDevHandle   Device handle.
	 *  @param   [out] p_pcVer_out    Output buffer for the version string.
	 *  @param   [in]  p_iVerLen_in   Length (in bytes) of the output buffer.
	 *  @return  None.
	 *******************************************************************/
	void BR08_PRO_API BR08_PRO_CALL Br08Pro_vGetDllVersion(HANDLE p_hDevHandle, char* p_pcVer_out, int p_iVerLen_in);

	/********************************************************************
	 *  @name   Br08Pro_iRegisterCallback
	 *  @brief   Register the asynchronous event callback function.
	 *  @param   [in] p_hDevHandle  Device handle.
	 *  @param   [in] pfnCallback   Callback function pointer.
	 *  @param   [in] pUserData     User-defined context, returned as-is in the callback.
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iRegisterCallback(HANDLE p_hDevHandle, BR08ProCallFun pfnCallback, void* pUserData);

	/********************************************************************
	 *  @name   Br08Pro_iUnRegisterCallback
	 *  @brief   Unregister the asynchronous event callback function.
	 *  @param   [in] p_hDevHandle  Device handle.
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iUnRegisterCallback(HANDLE p_hDevHandle);

	/********************************************************************
	 *  @name   Br08Pro_iGetStatus
	 *  @brief   Get the current device running status.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Device status output structure.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetStatus(HANDLE p_hDevHandle, stBr08Pro_devState* p_pstOutput, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetVersion
	 *  @brief   Get the device firmware version information.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Version data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetVersion(HANDLE p_hDevHandle, stBr08Pro_set_version_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetSecretNumber
	 *  @brief   Get the device serial number (security / key number).
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Serial number data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetSecretNumber(HANDLE p_hDevHandle, stBr08Pro_set_serialNumber_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iInit
	 *  @brief   Initialize the device (self-test and reset).
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iInit(HANDLE p_hDevHandle, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iCashIn
	 *  @brief   To press money into a circulation module or cash box.
	 *			 The hardware chooses to press into the circulation module or money box by itself. 
	 *			 The specific logic is that when the bill is received for the denomination set by the circulation drum, the bill enters the circulation drum. 
	 *           When the received bill does not set the denomination for the loop drum or the loop drum is full, the bill will be pressed into the money box.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iCashIn(HANDLE p_hDevHandle, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iCashOut
	 *  @brief   Perform a  refund operation.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iCashOut(HANDLE p_hDevHandle, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iDispense
	 *  @brief   Dispense bills by specified denomination and quantity.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    Dispense input structure (denomination, quantity, etc.).
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iDispense(HANDLE p_hDevHandle, stBr08Pro_oper_dispense_data* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iCashCount
	 *  @brief   Perform the banknote count operation. Feed the money in the loop module into the cash box.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    Cash-count input structure.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iCashCount(HANDLE p_hDevHandle, stBr08Pro_oper_cashCount_data* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetCurrencyAssign
	 *  @brief   Get the current currency assignment information.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Currency assignment data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetCurrencyAssign(HANDLE p_hDevHandle, stBr08Pro_set_currencyAssign_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetCurrencyAssign_withCurrency
	 *  @brief   Gets a list of denominations in the specified currency
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    The required currency parameter
	 *  @param   [out] p_pstOutput   Currency assignment data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetCurrencyAssign_withCurrency(HANDLE p_hDevHandle, stBr08Pro_currencyData* p_pstInput, stBr08Pro_set_currencyAssign_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);
	
	/********************************************************************
	 *  @name   Br08Pro_iGetSuppostRecvCurrency
	 *  @brief   Get a list of supported currencies
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Currency list
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetSuppostRecvCurrency(HANDLE p_hDevHandle, stBr08Pro_currencyCountData* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);
	
	/********************************************************************
	 *  @name   Br08Pro_iSetCurrentRecvCurrency
	 *  @brief  Sets the value of the currently accepted currencies
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    Currently supported accepted currency values
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSetCurrentRecvCurrency(HANDLE p_hDevHandle, stBr08Pro_currencyData* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);
	
	/********************************************************************
	 *  @name   Br08Pro_iGetCurrentRecvCurrency
	 *  @brief   Gets the currently supported currency values
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Currently supported accepted currency values
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetCurrentRecvCurrency(HANDLE p_hDevHandle, stBr08Pro_currencyData* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);
	/********************************************************************
	 *  @name  Br08Pro_iGetSuppost_nominalValueListNum
	 *  @brief   Gets the number of denominations in all currently supported currencies
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_iNum_output  The number of denominations in all currently supported currencies
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetSuppost_nominalValueListNum(HANDLE p_hDevHandle, int& p_iNum_output, tDevReturn* p_pstStatus);
	
	/********************************************************************
	 *  @name   Br08Pro_iGetCurrentRecvCurrency
	 *  @brief   Gets a list of all denominations in all currently supported currencies
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_iNum_input  The number of denominations in all currently supported currencies.
	 *  @param   [out] p_pstOutput   A list of all denominations of all currently supported currencies 
	 *                               with a number of elements equal to p_iNum_input.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetSuppost_nominalValueListData(HANDLE p_hDevHandle, int p_iNum_input, stBr08Pro_billData* p_pstOutput, tDevReturn* p_pstStatus);


	/********************************************************************
	 *  @name   Br08Pro_iSetBill_escrowCode_enable
	 *  @brief   Enables or disables the acceptable denomination code
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    Enable data input structure.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSetBill_escrowCode_enable(HANDLE p_hDevHandle, stBr08Pro_set_enable_data* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetBill_escrowCode_enable
	 *  @brief   Gets the enabled and disabled status of the acceptable denomination code.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Enable data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetBill_escrowCode_enable(HANDLE p_hDevHandle, stBr08Pro_set_enable_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iSetRecvInhibit
	 *  @brief   Set the receive-inhibit status.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    Inhibit data input structure.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSetRecvInhibit(HANDLE p_hDevHandle, stBr08Pro_set_inhibit_data* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetRecvInhibit
	 *  @brief   Get the receive-inhibit status.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   Inhibit data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetRecvInhibit(HANDLE p_hDevHandle, stBr08Pro_set_inhibit_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iSetRcUnitRecv
	 *  @brief   Set the receiving parameters of the circular cash box, and set the acceptable ecsrow code of the circular.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    recycling cassette receive data input structure.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSetRcUnitRecv(HANDLE p_hDevHandle, stBr08Pro_set_rcUnit_recv_data* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetRcUnitRecv
	 *  @brief   Get the recycling cassette receive parameters.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   recycling cassette receive data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetRcUnitRecv(HANDLE p_hDevHandle, stBr08Pro_set_rcUnit_recv_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iSetRcUnitCount
	 *  @brief   Set the recycling cassette bill count.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    recycling cassette count data input structure.
	 *  @param   [in]  p_bCallback   Execution mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSetRcUnitCount(HANDLE p_hDevHandle, stBr08Pro_set_rcUnit_count_data* p_pstInput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetRcUnitCount
	 *  @brief   Get the recycling cassette bill count.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstOutput   recycling cassette count data output structure.
	 *  @param   [in]  p_bCallback   Retrieval mode: 0 = synchronous; 1 = asynchronous (callback).
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetRcUnitCount(HANDLE p_hDevHandle, stBr08Pro_set_rcUnit_count_data* p_pstOutput, unsigned char p_bCallback, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iSendAckResponse
	 *  @brief   Send an ACK response to the device.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iSendAckResponse(HANDLE p_hDevHandle, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iGetHwLog
	 *  @brief   Get the device hardware log.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pstInput    Log query condition input structure .
	 *                               You can optionally get all logs or logs with a specified sequence number range.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iGetHwLog(HANDLE p_hDevHandle, stBr08Pro_log_data* p_pstInput, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iHwUpdate_rcUnitModule
	 *  @brief   Update the recycling cassette module firmware.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_ucModNo     recycling cassette module number.
	 *  @param   [in]  p_pcPath      Firmware file path.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *  @details Progress is reported via WM_BR08_PRO_HW_UPDATE
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iHwUpdate_rcUnitModule(HANDLE p_hDevHandle, unsigned char p_ucModNo, char* p_pcPath, tDevReturn* p_pstStatus);

	/********************************************************************
	 *  @name   Br08Pro_iHwUpdate_mainctrl
	 *  @brief   Update the main control board firmware.
	 *  @param   [in]  p_hDevHandle  Device handle.
	 *  @param   [in]  p_pcPath      Firmware file path.
	 *  @param   [out] p_pstStatus   Operation result status.When the api fails,
	 *                               look for iPhyCode or iLogicCode (see BR08_PRO_SF_CODE_XXX for details)
	 *  @return  0 on success; non-zero on failure.
	 *  @details Progress is reported via WM_BR08_PRO_HW_UPDATE
	 *******************************************************************/
	int BR08_PRO_API BR08_PRO_CALL Br08Pro_iHwUpdate_mainctrl(HANDLE p_hDevHandle, char* p_pcPath, tDevReturn* p_pstStatus);
#if defined(__cplusplus)
}
#endif

#endif /* BR08_PRO_DEV_H_ */
// End of file
