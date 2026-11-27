#ifndef __BR08_PRO_DEV_STRUCT_H__
#define __BR08_PRO_DEV_STRUCT_H__

#include "BR08ProDevDef.h"
#include "typedef.h"

/**
* @file BR08ProDevStruct.h
* @brief BR08ProDev SDK public data structures (operation/setting/state/log).
*        All structures use 1-byte packing (#pragma pack(push,1)).
*/

#pragma pack(push,1)
#define BR08_PRO_RC_UNIT_MAX_NUM 4
#define BR08_PRO_RC_UNIT_COUNT_MAX_NUM 35

/************************usually_data end****************************/
typedef struct
{
	// Original data (from device)
	unsigned char ucEscrowCode;// Escrow code, see BR08_PRO_ESCROW_CODE_XXX
	unsigned char ucCountryType;// Country type code
	unsigned char ucDenominationData1;// Denomination byte 1
	unsigned char ucDenominationData2;// Denomination byte 2
	// Transformed data (to host)
	char cCountryDesc[8];// Country description string
	unsigned int uiDenomination;// Resolved denomination value
}stBr08Pro_billData;


typedef struct
{
	unsigned char ucCurrencyType;// Currency type code, see BR08_PRO_CUR_CODE_XXX
    char cCurrencyDesc[8];
}stBr08Pro_currencyData;

typedef struct
{
    unsigned char ucIsValidArrayCount;
	stBr08Pro_currencyData stCurrencyData[50];
}stBr08Pro_currencyCountData;

/************************usually_data start****************************/

/************************operation_data start****************************/
typedef struct
{
	unsigned char ucRcUnitNo;// Recycle-unit index, see BR08_PRO_RC_UNIT_XXX
	unsigned char ucNeedDispenseNum;// Number of bills to dispense from this unit, don't over BR08_PRO_RC_UNIT_COUNT_MAX_NUM(35)
}stBr08Pro_oper_dispense_data_unit;

typedef struct
{ 
	unsigned char ucIsValidArrayCount;// Valid element count in the array below
	// Bills are issued in array order
	stBr08Pro_oper_dispense_data_unit stDispenseData_unit[BR08_PRO_RC_UNIT_MAX_NUM];
}stBr08Pro_oper_dispense_data;

typedef struct
{
	unsigned char ucRcUnitNo;// Recycle-unit index, see BR08_PRO_RC_UNIT_XXX
	unsigned char ucNeedCashCountNum;// Number of bills to count from this unit
}stBr08Pro_oper_cashCount_data_unit;

typedef struct
{
	unsigned char ucIsValidArrayCount;// Valid element count in the array below
	// Bills are counted in array order
	stBr08Pro_oper_cashCount_data_unit stCashCountData_unit[BR08_PRO_RC_UNIT_MAX_NUM];
}stBr08Pro_oper_cashCount_data;

/************************operation_data end****************************/

/************************setting_data start****************************/
typedef struct
{
	// [0]-[7] correspond to escrowCode[61H]-[68H]
	unsigned char ucIsEnable_escrowCode_bill[8];// Per-code enable flag, see BR08_PRO_DEV_BOOL_TRUE
	unsigned char ucIsEnable_escrowCode_bill_reservred[8];// Reserved
}stBr08Pro_set_enable_data;

typedef struct
{
	unsigned char ucIsInhibit;// 0 = not inhibited (start receiving); 1 = inhibited (stop receiving)
	unsigned char ucReserved[7];// Reserved
}stBr08Pro_set_inhibit_data;


typedef struct
{
	char cVersion[255];// Firmware version string
}stBr08Pro_set_version_data;

typedef struct
{
	char cSerial[255];// Serial number string
}stBr08Pro_set_serialNumber_data;

typedef struct
{
	unsigned char ucRcUnitNo;// Recycle-unit index, see BR08_PRO_RC_UNIT_XXX
	unsigned char ucCountryType;// Country type code,see BR08_PRO_CUR_CODE_XXX
	char cCountryDesc[8];
}stBr08Pro_rcUnit_recv_currency_unit;


typedef struct
{
	unsigned char ucIsValidArrayCount;// Valid element count in the array below
	stBr08Pro_rcUnit_recv_currency_unit stRcUnit_unit[BR08_PRO_RC_UNIT_MAX_NUM];
}stBr08Pro_set_rcUnit_currency_data;

typedef struct
{
	// Original data (from device)
	unsigned char ucRcUnitNo;// Recycle-unit index, see BR08_PRO_RC_UNIT_XXX
	unsigned char ucEscrowCode; // Escrow code, see BR08_PRO_ESCROW_CODE_XXX
	unsigned char ucCountryType;// Country type code,see BR08_PRO_CUR_CODE_XXX
	// Transformed data (to host)
	char cCountryDesc[8];
	unsigned int uiDenomination_out;//input no use
}stBr08Pro_rcUnit_recv_data_unit;

typedef struct
{
	unsigned char ucIsValidArrayCount;// Valid element count in the array below
	stBr08Pro_rcUnit_recv_data_unit stRcUnit_unit[BR08_PRO_RC_UNIT_MAX_NUM];
}stBr08Pro_set_rcUnit_recv_data;

typedef struct
{
	unsigned char ucRcUnitNo;// Recycle-unit index, see BR08_PRO_RC_UNIT_XXX
	unsigned short RecycleCurrentCount;// Current recycled bill count of this unit
}stBr08Pro_rcUnit_count_data_unit;

typedef struct
{
	unsigned char ucIsValidArrayCount;// Valid element count in the array below
	stBr08Pro_rcUnit_count_data_unit stRcUnitCount_unit[BR08_PRO_RC_UNIT_MAX_NUM];
}stBr08Pro_set_rcUnit_count_data;



typedef struct
{
	unsigned char ucBillData_ValiCount;// Valid element count in the array below
	stBr08Pro_billData stBillData[16];// Currency assignment table
}stBr08Pro_set_currencyAssign_data;

typedef union
{
	unsigned char ucData_base[512];// Raw byte buffer
	stBr08Pro_set_version_data		stSettingID_71H_version[1];
	stBr08Pro_set_enable_data			stSettingID_80H_enable[1];
	stBr08Pro_set_inhibit_data		stSettingID_83H_inhibit[1];
	stBr08Pro_set_rcUnit_recv_data	stSettingID_90H_rcUnit[1];
	stBr08Pro_set_rcUnit_count_data	stSettingID_91H_rcUnitCount[1];
	stBr08Pro_currencyCountData		stSettingID_98H_suppostCurrency[1];
	stBr08Pro_currencyData			stSettingID_99H_currency[1];
	stBr08Pro_set_currencyAssign_data stSettingID_9AH_currencyAssign[1];
}unBr08Pro_settingState_data;

typedef struct
{
	unsigned char ucSettingID;// Setting ID (command 0x70+ range)
	unsigned char bHasData;// 0 = FALSE, 1 = TRUE (payload present)
    unsigned char uc_union_devState_data_map[512];// Overlays unBr08Pro_devState_data
}stBr08Pro_settingState;
/************************setting_data end****************************/

/************************devState_data start****************************/
typedef struct
{
	// --- BYTE 1: Entry & Cassette Sensors ---
	unsigned char skew_left_u;      // BIT0: Skew Correction Left U-type Sensor
	unsigned char skew_right_u;     // BIT1: Skew Correction Right U-type Sensor
	unsigned char inlet_bottom_beam;// BIT2: Bottom Inlet Through-beam Sensor
	unsigned char inlet_beam;       // BIT3: Inlet Through-beam Sensor
	unsigned char cis_front_beam;   // BIT4: CIS Front Through-beam Sensor
	unsigned char cis_rear_beam;    // BIT5: CIS Rear Through-beam Sensor
	unsigned char clamp_thrust_u;   // BIT6: Bill Clamp Thrust U-type Sensor
	unsigned char cassette_exist_u; // BIT7: Cassette Presence U-type Sensor

	// --- BYTE 2: Motor & Return Path Sensors ---
	unsigned char reserved_b2_0;    // BIT0: Reserved
	unsigned char main_motor_enc;   // BIT1: Main Motor Encoder
	unsigned char press_motor_enc;  // BIT2: Press Motor Encoder
	unsigned char reserved_b2_3;    // BIT3: Reserved
	unsigned char loop1_front_beam; // BIT4: Recycler 1 Front Through-beam Sensor
	unsigned char loop2_front_beam; // BIT5: Recycler 2 Front Through-beam Sensor
	unsigned char reject_channel;   // BIT6: Reject Channel Sensor
	unsigned char reject_outlet;    // BIT7: Reject Outlet Sensor

	// --- BYTE 3: RC Sensors & Locks ---
	unsigned char rc1_beam;         // BIT0: RC1 Through-beam Sensor
	unsigned char rc2_beam;         // BIT1: RC2 Through-beam Sensor
	unsigned char reserved_b3_2;    // BIT2: Reserved
	unsigned char reserved_b3_3;    // BIT3: Reserved
	unsigned char loop1_lock;       // BIT4: Recycler Module 1 Lock Status
	unsigned char reserved_b3_5;    // BIT5: Reserved
	unsigned char reserved_b3_6;    // BIT6: Reserved
	unsigned char reserved_b3_7;    // BIT7: Reserved

	// --- BYTE 4: RC Sensors & Locks ---
	unsigned char rc3_beam;         // BIT0: RC3 Through-beam Sensor
	unsigned char rc4_beam;         // BIT1: RC4 Through-beam Sensor
	unsigned char reserved_b4_2;    // BIT2: Reserved
	unsigned char reserved_b4_3;    // BIT3: Reserved
	unsigned char loop2_lock;       // BIT4: Recycler Module 2 Lock Status
	unsigned char reserved_b4_5;    // BIT5: Reserved
	unsigned char reserved_b4_6;    // BIT6: Reserved
	unsigned char reserved_b4_7;    // BIT7: Reserved
}unBr08Pro_devState_sensor;



typedef union
{
	unsigned char ucData_base[32];// Raw byte buffer (4 bytes)
	// Status 0x13: escrow denomination, see BR08_PRO_ESCROW_CODE_XXX
	stBr08Pro_billData stStatusID_13H_billData[1];
	// Status 0x14: stacking recovery cycle drum unit, see BR08_PRO_RC_UNIT_XXX.
	//The loop drum in which the currently uncredited bill is located
	unsigned char ucStatusID_14H_stacking_rcUnit;
	// Status 0x16: stacked  recovery cycle drum unit, see BR08_PRO_RC_UNIT_XXX
	// The loop drum in which the bill was just received
	unsigned char ucStatusID_16H_stacked_rcUnit;
	// Status 0x17: reject code, see BR08_PRO_REJECT_ECODE_XXX
	unsigned char ucStatusID_17H_rejecting_rejectCode;
	// Status 0x21: collecting recovery cycle drum unit, see BR08_PRO_RC_UNIT_XXX
	// Loop drum in checkout
	unsigned char ucStatusID_21H_collecting_rcUnit;
	// Status 0x22: collected recovery cycle drum unit, see BR08_PRO_RC_UNIT_XXX
	//The loop drum just checked out. Each message represents the completion of the checkout, 
	//but the specific attention should be paid to the count of the loop drum
	unsigned char ucStatusID_22H_collected_rcUnit;
	// Status 0x45: hardware error code, see BR08_PRO_HW_CODE_XXX
	unsigned short ushStatusID_45H_hw_code;
}unBr08Pro_devState_data;

/********************************************************************
 *  @name   stBr08Pro_devState
 *  @brief   Device running status structure.
 *  @details Returned synchronously by Br08Pro_iGetStatus, and also delivered
 *           asynchronously as the payload of the WM_BR08_PRO_STATUS_CHANGED
 *           callback (the callback's `data` parameter points to this struct).
 *           Member interpretation:
 *             - ucStatusID : status ID that selects which union field of
 *                            unBr08Pro_devState_data is meaningful.
 *             - bHasData   : 1 = uc_union_devState_data_map[4] carries a
 *                            status-specific payload; 0 = ignore those 4 bytes.
 *             - uc_union_devState_data_map[4] : overlays unBr08Pro_devState_data;
 *                            e.g. when ucStatusID == BR08_PRO_STATUS_DEV_FAILURE
 *                            (0x45) the bytes map to ushStatusID_45H_hw_code
 *                            (hardware error code, see BR08_PRO_HW_CODE_*).
 *  @code
 *  // (1) Synchronous: read status via Br08Pro_iGetStatus
 *  stBr08Pro_devState l_stState = {0};
 *  tDevReturn l_stRet = {0};
 *  int l_iRet = Br08Pro_iGetStatus(l_hDev, &l_stState, &l_stRet);
 *  if (0 == l_iRet) {
 *      printf("statusID=0x%02X bHasData=%d\n", l_stState.ucStatusID, l_stState.bHasData);
 *      if (l_stState.bHasData) {
 *          // Interpret uc_union_devState_data_map[4] by ucStatusID
 *          unBr08Pro_devState_data uData;
 *          memcpy(&uData, l_stState.uc_union_devState_data_map, sizeof(uData));
 *          switch (l_stState.ucStatusID)
 *          {
 *			case BR08_PRO_STATUS_ESCROW:
 *				printf("  value:%d(0x%02X),%s\n", uData.stStatusID_13H_billData[0].uiDenomination,
 *				uData.stStatusID_13H_billData[0].ucEscrowCode, uData.stStatusID_13H_billData[0].cCountryDesc);
 *              break;
 *          case BR08_PRO_STATUS_STACKING:
 *              printf("  StackingRCUnit: 0x%02X\n", uData.ucStatusID_14H_stacking_rcUnit);
 *              break;
 *          case BR08_PRO_STATUS_STACKED:
 *              printf("  StackedRCUnit: 0x%02X\n", uData.ucStatusID_16H_stacked_rcUnit);
 *              break;
 *          case BR08_PRO_STATUS_REJECTING:
 *              printf("  RejectCode: 0x%02X\n", uData.ucStatusID_17H_rejecting_rejectCode);
 *              break;
 *          case BR08_PRO_RECYCLE_STATE_COLLECTION:
 *              printf("  CollectingRCUnit: 0x%02X\n", uData.ucStatusID_21H_collecting_rcUnit);
 *              break;
 *          case BR08_PRO_RECYCLE_STATE_COLLECTED:
 *              printf("  CollectedRCUnit: 0x%02X\n", uData.ucStatusID_22H_collected_rcUnit);
 *              break;
 *          case BR08_PRO_STATUS_DEV_FAILURE:
 *              printf("  HwErrCode: 0x%04X\n", uData.ushStatusID_45H_hw_code);
 *              break;
 *          default:
 *              printf("  Data: 0x%02X 0x%02X 0x%02X 0x%02X\n",
 *                  uData.ucData_base[0], uData.ucData_base[1], uData.ucData_base[2], uData.ucData_base[3]);
 *              break;
 *          }
 *      }
 *  }
 *  // (2) Asynchronous: handle WM_BR08_PRO_STATUS_CHANGED in the callback
 *  intptr_t MyStatusCallback(void* pUserData, unsigned int uMsg,
 *          const unsigned char* data, const unsigned int dataLen,
 *          unsigned int execResult, unsigned int endCode) {
 *      if (uMsg == WM_BR08_PRO_STATUS_CHANGED) {
 *          const stBr08Pro_devState* l_pstState = (const stBr08Pro_devState*)data;
 *          printf("statusID=0x%02X\n", l_pstState->ucStatusID);
 *      }
 *      return 0;
 *  }
 *  @endcode
 *  *******************************************************************/
typedef struct
{
	unsigned short					ushHwRetrun;// Hardware return code
	stBr08Pro_set_rcUnit_count_data stRcUnitCount[1];// Recycle-unit counts
	unBr08Pro_devState_sensor		stSensor[1];// Sensor states
	unsigned char					ucStatusID;// Current status ID
	unsigned char					bHasData;// 0 = FALSE, 1 = TRUE (payload present)
	unsigned char					uc_union_devState_data_map[32];// Overlays unBr08Pro_devState_data
}stBr08Pro_devState;

typedef struct
{
	int iOpenSign;// Log open flag
	int iRemainDays;// Remaining log retention days
	int iTraceLevel;// Trace/log level
	char cLogBasePath[300];// Log base directory path
}stBr08Pro_dllLogSet;
/************************devState_data end****************************/

/************************operState_data start****************************/
typedef struct
{
	char cPath[256];// Absolute path (not relative)
    unsigned char ucIsGetAllRecord;// Whether to retrieve all records, see BR08_PRO_DEV_BOOL_TRUE
	unsigned int uiNoGetAll_startNo;// Start record number (when not retrieving all)
    unsigned int uiNoGetAll_endNo;// End record number (when not retrieving all)
}stBr08Pro_log_data;

typedef struct
{
	char cPath[256];// Absolute path (not relative)
	unsigned int uiLogNo_start;// First log record number
	unsigned int uiLogNo_now;// Current log record number
    unsigned int uiLogNo_end;// Last log record number
	unsigned char ucIsGetLogOK;// Whether log retrieval succeeded, see BR08_PRO_DEV_BOOL_TRUE

}stBr08Pro_log_callback_data;

typedef struct
{
	char cPath[256];// Absolute path (not relative)
	unsigned int uiUpdateNo_start;// First update packet number
	unsigned int uiUpdateNo_now;// Current update packet number
	unsigned int uiUpdateNo_end;// Last update packet number
	unsigned char ucUpdateStatus;// Update status, see BR08_PRO_STATUS_UPDATE_XXXX
	unsigned char ucIsUpdateOK;// Whether update succeeded, see BR08_PRO_DEV_BOOL_TRUE
}stBr08Pro_hw_update_callback_data;

/************************operState_data end****************************/
/*
* Asynchronous event / completion notification callback.
* Identical signature on Windows and Linux.
*   pUserData : User context pointer passed at registration; returned as-is in the callback.
*   uMsg      : Notification message ID, one of the WM_BR08_PRO_* values (see BR08ProDevDef.h).
*   data      : Pointer to the message payload; the payload struct type depends on uMsg.
*               (1)uMsg is WM_BR08_PRO_DEVICE_DISCONNECTED,no data is returned
*               (2)uMsg is WM_BR08_PRO_COMPLETE, return data is a pointer to stBr08Pro_settingState
*               (3)uMsg is WM_BR08_PRO_STATUS_CHANGED, return data is a pointer to stBr08Pro_devState
*				(3-1)when statusId is BR08_PRO_STATUS_DEV_FAILURE, we need care about uc_union_devState_data_map( ushStatusID_45H_hw_code) 
*               (4)uMsg is WM_BR08_PRO_HW_LOG_GET, return data is a pointer to stBr08Pro_log_callback_data
*               (5)uMsg is WM_BR08_PRO_HW_UPDATE, return data is a pointer to stBr08Pro_hw_update_callback_data
*   dataLen   : Length (in bytes) of the payload pointed to by data.
*   execResult: Execution result code of the operation.
*   endCode   : Operation end code.
*   Returns   : User-defined; the DLL does not use the return value.
*   Note      : Do NOT call any BR08Pro_xxx API from inside the callback function.
*/
typedef intptr_t (*BR08ProCallFun)(void* pUserData, unsigned int uMsg, const unsigned char* data, const unsigned int dataLen, unsigned int execResult, unsigned int endCode);

#pragma pack(pop)

#endif
