#ifndef BR08_PRO_DEV_DEF_H_
#define BR08_PRO_DEV_DEF_H_

#include <stdint.h>

/**
* @file BR08ProDevDef.h
* @brief BR08ProDev SDK public constants: control flags, device/status IDs,
*        command IDs, recycling cassette / escrow / reject definitions, software and
*        hardware error codes, and currency code tables.
*/


/* ---- Operation control flags ---- */
#define  BR08_PRO_DEV_IGNORE	0	/* Ignore the abnormal condition */
#define  BR08_PRO_DEV_RESEND	1	/* Resend the command */
#define  BR08_PRO_DEV_INIT		2	/* Re-initialize the device */
#define  BR08_PRO_DEV_STOP		3	/* Stop the current operation */

/* ---- Device result level ---- */
#define  BR08_PRO_DEV_NORMAL		0	/* Normal */
#define  BR08_PRO_DEV_WARNNING		1	/* Warning */
#define  BR08_PRO_DEV_ERROR		2	/* Error */


/*
* Asynchronous notification message IDs.
* These values are carried by the uMsg parameter of BR08ProCallFun (see BR08ProDevStruct.h).
*/
#define WM_BR08_PRO							0u
#define WM_BR08_PRO_DEVICE_DISCONNECTED		( WM_BR08_PRO + 1)	/* Device disconnected */
#define WM_BR08_PRO_COMPLETE				( WM_BR08_PRO + 2)	/* Operation complete. Payload: struct stBr08Pro_settingState */
#define WM_BR08_PRO_STATUS_CHANGED			( WM_BR08_PRO + 3)	/* Status changed.    Payload: struct stBr08Pro_devState */
#define WM_BR08_PRO_HW_LOG_GET				( WM_BR08_PRO + 4)	/* Hardware log ready.Payload: struct stBr08Pro_log_callback_data */
#define WM_BR08_PRO_HW_UPDATE				( WM_BR08_PRO + 5)	/* Firmware update progress. Payload: struct stBr08Pro_hw_update_callback_data */
/****************************************************************/
/* Status ID                                                    */
/****************************************************************/
// STATUS
#define BR08_PRO_STATUS_WAITING_RECV							0x11	/* Wating to reccive */
#define BR08_PRO_STATUS_ACCEPTING								0x12	/* Accepting bills */
#define BR08_PRO_STATUS_ESCROW									0x13	/* Bill in escrow (temporary storage) */
#define BR08_PRO_STATUS_STACKING								0x14	/* Stacking */
#define BR08_PRO_STATUS_VEND_VALID 								0x15	/* Vend validated ,need send ack*/
#define BR08_PRO_STATUS_STACKED									0x16	/* Stacked */
#define BR08_PRO_STATUS_REJECTING								0x17	/* Rejecting */
#define BR08_PRO_STATUS_RETURNING								0x18	/* Returning (to user) */
#define BR08_PRO_STATUS_IDLE									0x1A	/* Idle */
#define BR08_PRO_STATUS_INITIALIZE								0x1B	/* Initializing */

/* RECYCLE states from the normal status request */
#define BR08_PRO_RECYCLE_STATE_PAYING							0x20	/* Paying out */
#define BR08_PRO_RECYCLE_STATE_COLLECTION						0x21	/* Collecting */
#define BR08_PRO_RECYCLE_STATE_COLLECTED						0x22	/* Collected */
#define BR08_PRO_RECYCLE_STATE_PAY_VALID						0x23	/* Pay validated ,need send ack*/
#define BR08_PRO_RECYCLE_STATE_PAY_STAY							0x24	/* Pay staying */
// STATUS (Power up)
#define BR08_PRO_STATUS_POWER_UP								0x40	/* Power up */
#define BR08_PRO_STATUS_POWER_UP_WITH_BILL_IN_ACCEPTOR			0x41	/* Power up with bill in acceptor */
#define BR08_PRO_STATUS_POWER_UP_WITH_BILL_IN_STACKER			0x42	/* Power up with bill in stacker */
// STATUS (Error)
#define BR08_PRO_STATUS_CASH_BOX_FULL							0x43	/* Cash box full */
#define BR08_PRO_STATUS_CASH_BOX_OUT							0x44	/* Cash box out */
#define BR08_PRO_STATUS_DEV_FAILURE								0x45	/* Device failure */

#define BR08_PRO_STATUS_ACK_FAIL								0x4B	/* ACK failed */
#define BR08_PRO_STATUS_ACK_SCUCCESS							0x50	/* ACK success */

#define BR08_PRO_STATUS_BILL_IN_CHANNEL							0x71	/* Bill detected in channel */

// STATUS (Download / Firmware update)
//BR08_PRO_STATUS_UPDATE_XXXX
#define BR08_PRO_STATUS_UPDATE_START							0xD3	/* Update started */
#define BR08_PRO_STATUS_UPDATE_DOING							0xD4	/* Update in progress */
#define BR08_PRO_STATUS_UPDATE_END								0xD5	/* Update finished */


//////////////////////////////////////////////////////////////////
// Command ID
//////////////////////////////////////////////////////////////////
#define BR08_PRO_REQTYPE								0xEE	/* Frame type / request type */

#define BR08_PRO_REQID_STATUS							0x70	/* Status request */
#define BR08_PRO_REQID_GET_VERSION						0x71	/* Get firmware version */
#define BR08_PRO_REQID_GET_SERIAL_NUMBER				0x72	/* Get serial number */
#define BR08_PRO_REQID_OPE_INIT							0x40	/* Initialize operation */
#define BR08_PRO_REQID_CASH_IN							0x42	/* Cash in (accept bills) */
#define BR08_PRO_REQID_CASH_OUT							0x43	/* Cash out (refund) */
#define BR08_PRO_REQID_DISPENSE							0x44	/* Dispense (give change) */
#define BR08_PRO_REQID_CASH_COUNT						0x45	/* Cash count (settle) */
#define BR08_PRO_REQID_ACK_RESPONSE						0x50	/* ACK response */

#define BR08_PRO_REQID_GET_ESCROW_CODE_DISABLE			0x80	/* Get escrow code disable status */
#define BR08_PRO_REQID_SET_ESCROW_CODE_DISABLE			0xC0	/* Set escrow code disable status */
#define BR08_PRO_REQID_GET_RECV_INHIBIT					0x83	/* Get receive inhibit status */
#define BR08_PRO_REQID_SET_RECV_INHIBIT					0xC3	/* Set receive inhibit status */
#define BR08_PRO_REQID_GET_RC_COUNT						0x91	/* Get recycling cassette count */
#define BR08_PRO_REQID_SET_RC_COUNT						0xD1	/* Set recycling cassette count */
#define BR08_PRO_REQID_GET_RC_UNIT						0x95	/* Get recycling cassette denomination */
#define BR08_PRO_REQID_SET_RC_UNIT						0xD5	/* Set recycling cassette denomination */
#define BR08_PRO_REQID_GET_SUPPOST_RCEV_CURRENCY		0x98	/* Get the currently supported currencies */
#define BR08_PRO_REQID_GET_CUR_RCEV_CURRENCY			0x99	/* Get the current receiving currency */
#define BR08_PRO_REQID_SET_CUR_RCEV_CURRENCY			0xD9	/* Set the current receiving currency */
#define BR08_PRO_REQID_GET_CURRENCY_ASSIGN				0x9A	/* Get currency code assignment */

#define BR08_PRO_REQID_DEV_BOOT_LOADER					0x52	/* Enter device boot loader */
#define BR08_PRO_REQID_GET_LOG							0x6C	/* Get hardware log */
#define BR08_PRO_REQID_HW_HIGH_SPEED					0x73	/* High-speed hardware mode */
#define BR08_PRO_REQID_CLSE_HW_RC_POLLING				0x77	/* Set recycling cassette polling (close) */
#define BR08_PRO_REQID_DEV_RC_MOD_UPDATE_EXEC			0x78	/* Execute recycling cassette module update */
#define BR08_PRO_REQID_DEV_RC_MOD_BOOT_LOADER			0x79	/* recycling cassette module boot loader */

#define BR08_PRO_RC_EXEC_STATUS							0xF0	/* recycling cassette update: status */
#define BR08_PRO_RC_EXEC_UPDATING						0xF1	/* recycling cassette update: updating */
#define BR08_PRO_RC_EXEC_UPDATE_OK						0xF2	/* recycling cassette update: OK */
#define BR08_PRO_RC_EXEC_UPDATE_EXEC					0xF3	/* recycling cassette update: executing */

#define BR08_PRO_HW_BOOT_LOADER_EXEC_UPDATE_DATA			0x1C	/* Boot loader: exec update data */
#define BR08_PRO_HW_BOOT_LOADER_EXEC_UPDATE_OK				0x1D	/* Boot loader: exec update OK */
#define BR08_PRO_HW_BOOT_LOADER_EXEC_UPDATE_LEN				0x1E	/* Boot loader: exec update length */


//BR08_PRO_RC_UNIT_XXX
#define BR08_PRO_RC_UNIT_STACKER 0	/* Recycle unit: stacker */
#define BR08_PRO_RC_UNIT_RC1	 1	/* Recycle unit: RC1 */
#define BR08_PRO_RC_UNIT_RC2	 2	/* Recycle unit: RC2 */
#define BR08_PRO_RC_UNIT_RC3	 3	/* Recycle unit: RC3 */
#define BR08_PRO_RC_UNIT_RC4	 4	/* Recycle unit: RC4 */
#define BR08_PRO_RC_UNIT_MAX	 4	/* Maximum recycling cassette index */

#define BR08_PRO_RC_UNIT_MOD1	1	/* recycling cassette module 1 */
#define BR08_PRO_RC_UNIT_MOD2	2	/* recycling cassette module 2 */

//BR08_PRO_RECYCLE_COLLECT_XXX
#define BR08_PRO_RECYCLE_COLLECT_ALL_BILL			0x00	/* Collect all bills */
#define BR08_PRO_RECYCLE_COLLECT_ONE_BILL			0x01	/* Collect one bill */

//BR08_PRO_ESCROW_CODE_XXX
#define BR08_PRO_ESCROW_CODE_61H	0x61	/* Escrow code 0x61 */
#define BR08_PRO_ESCROW_CODE_62H	0x62	/* Escrow code 0x62 */
#define BR08_PRO_ESCROW_CODE_63H	0x63	/* Escrow code 0x63 */
#define BR08_PRO_ESCROW_CODE_64H	0x64	/* Escrow code 0x64 */
#define BR08_PRO_ESCROW_CODE_65H	0x65	/* Escrow code 0x65 */
#define BR08_PRO_ESCROW_CODE_66H	0x66	/* Escrow code 0x66 */
#define BR08_PRO_ESCROW_CODE_67H	0x67	/* Escrow code 0x67 */
#define BR08_PRO_ESCROW_CODE_68H	0x68	/* Escrow code 0x68 */

//BR08_PRO_DEV_BOOL_XXX
#define BR08_PRO_DEV_BOOL_FALSE						0x00	/* Boolean false */
#define BR08_PRO_DEV_BOOL_TRUE						0x01	/* Boolean true */

//BR08_PRO_REJECT_ECODE_XXX
#define BR08_PRO_REJECT_ECODE_ALG_UNEXEC       0x11	/* Algorithm not executed */
#define BR08_PRO_REJECT_ECODE_NOTE_LONG        0x20	/* Scanned bill too long (over-length) */
#define BR08_PRO_REJECT_ECODE_NOTE_INIT        0x30	/* Note initialization */
#define BR08_PRO_REJECT_ECODE_NOTE_UNKNOWN     0x31	/* Unsupported bill */
#define BR08_PRO_REJECT_ECODE_NOTE_DISABLE     0x32	/* Bill not enabled */
#define BR08_PRO_REJECT_ECODE_NOTE_UNALIGN     0x33	/* Bill skewed (misaligned) */
#define BR08_PRO_REJECT_ECODE_ADJMODE          0x34	/* Calibration mode */
#define BR08_PRO_REJECT_ECODE_FILLFULL         0x35	/* Recycle drum full during refill */
#define BR08_PRO_REJECT_ECODE_NOTE_SHORT       0x40	/* Scanned bill too short (under-length) */
#define BR08_PRO_REJECT_ECODE_SCAN_ERR         0x50	/* Scan error (timing error) */
#define BR08_PRO_REJECT_ECODE_LOSE_PLUS        0x51	/* Pulse loss due to excessive scan time */
#define BR08_PRO_REJECT_ECODE_INTO_ERR         0x52	/* Bill failed to enter CIS tube */
#define BR08_PRO_REJECT_ECODE_RECOG_TIMEOUT    0x53	/* Recognition timeout */


/* ============================================================
 * BR08 PRO Software Status Codes
 *
 * Note: C010H~C03BH are documented as RC3.
 *       C060H~C08BH follow the same structural pattern as
 *       B060H~B08BH (RC2), therefore inferred as RC4.
 * ============================================================ */
 /******************CUR_CODE START****************************************/
//BR08_PRO_SF_CODE_XXX
#define BR08_PRO_SF_CODE_SUCCESS					0x000000	/* Success */
#define BR08_PRO_SF_CODE_W_LOG_DISK_WILL_FULL		0x010037	/* Insufficient disk space; reported when remaining space < 200MB at file open/create */

#define BR08_PRO_SF_CODE_E_HANDLE_PARAMETER   0x020001	/* Invalid handle parameter */
#define BR08_PRO_SF_CODE_E_TOO_MANY_DEVICES   0x020002	/* Too many devices opened */
#define BR08_PRO_SF_CODE_E_HANDLE_INVAILD     0x020003	/* Invalid handle */
#define BR08_PRO_SF_CODE_E_INVALID_CODE       0x020004	/* Invalid code */
#define BR08_PRO_SF_CODE_E_DEVRETURN_NULL     0x020010	/* tDevReturn pointer is NULL */
#define BR08_PRO_SF_CODE_E_DEVBASE_PRE_INIT   0x020011	/* DevBase not pre-initialized */
#define BR08_PRO_SF_CODE_E_DEVBASE_COMM_CONFIG 0x020012	/* DevBase communication config error */
#define BR08_PRO_SF_CODE_E_DEVBASE_COMM_INIT  0x020013	/* DevBase communication init error */
#define BR08_PRO_SF_CODE_E_COMM_SEND_FAIL     0x020014	/* Communication send failed */
#define BR08_PRO_SF_CODE_E_COMM_RECV_TIMEOUT  0x020015	/* Communication receive timeout */
#define BR08_PRO_SF_CODE_E_COMM_RECV_CMD_ERR  0x020016	/* Communication receive command error */
#define BR08_PRO_SF_CODE_E_COMM_RECV_NAK      0x020017	/* Communication receive NAK */
#define BR08_PRO_SF_CODE_E_COMM_RECV_PARAM    0x020018	/* Communication receive parameter error */
#define BR08_PRO_SF_CODE_E_INPUT_PARAM_PTR_NULL 0x020020	/* Input parameter pointer is NULL */
#define BR08_PRO_SF_CODE_E_INPUT_PARAM_ERR    0x020021	/* Input parameter error */
#define BR08_PRO_SF_CODE_E_LOG_DIR_STRING_ILLEGAL 0x020030	/* Illegal directory string */
#define BR08_PRO_SF_CODE_E_LOG_DIR_NAME_ILLEGAL   0x020031	/* Illegal directory name */
#define BR08_PRO_SF_CODE_E_LOG_DIR_LEN_TO_LONG    0x020032	/* Directory name too long */
#define BR08_PRO_SF_CODE_E_LOG_DIR_ACCESS_DENIED  0x020033	/* Access denied */
#define BR08_PRO_SF_CODE_E_LOG_DIR_PATH_NOT_FOUND 0x020034	/* Path not found */
#define BR08_PRO_SF_CODE_E_LOG_DIR_FILE_NOT_FOUND 0x020035	/* File not found */
#define BR08_PRO_SF_CODE_E_LOG_DIR_OTHER_ERR      0x020036	/* Other directory error */
#define BR08_PRO_SF_CODE_E_LOG_DISK_NOT_EXIST     0x020037	/* Disk does not exist */
#define BR08_PRO_SF_CODE_E_LOG_FILE_SEEK_ERR      0x020038	/* File seek error */
#define BR08_PRO_SF_CODE_E_LOG_FILE_WRITE_ERR     0x020039	/* File write error */
#define BR08_PRO_SF_CODE_E_HW_LOG_PATH_TOO_LONG   0x020040	/* Hardware log path too long */
#define BR08_PRO_SF_CODE_E_HW_LOG_PATH_OPEN		  0x020041	/* Hardware log path open failed */
#define BR08_PRO_SF_CODE_E_LOGIC_NEED_STOP_RECV   0x020050	/* Logic layer needs to stop receiving */
#define BR08_PRO_SF_CODE_E_LOGIC_NEED_INIT		  0x020051	/* Logic layer needs initialization */
#define BR08_PRO_SF_CODE_E_LOGIC_NEED_SEND_ACK	  0x020052	/* Logic layer needs to send ACK */
#define BR08_PRO_SF_CODE_E_LOGIC_RC_HAS_BILL_NEED_CLEAR	  0x020053	/* Logic layer: recycle drum has bills, needs clearing */
#define BR08_PRO_SF_CODE_E_LOGIC_NEED_START_RECV	0x020054	/* Logic layer needs to start receiving */
#define BR08_PRO_SF_CODE_E_LOGIC_NEED_SET_COMM		0x020055	/* Logic layer needs to set comm port */
#define BR08_PRO_SF_CODE_E_LOGIC_INPUT_RC_COUNT_OVER_MAX  0x020056	/* Logic layer set int rc count over dev max num */
#define BR08_PRO_SF_CODE_E_LOGIC_BILL_IN_ESCROW		0x020057	/* Logic layer bill in escrow, need cash in or cash out */
#define BR08_PRO_SF_CODE_E_LOGIC_INPUT_OVER_DEV_RC_NUM  0x020058 /*The number of notes out or cleared is greater than the number of recycle drums*/
/* ============================================================
 * BR08 PRO Hardware Status Codes
 *
 * Note: C010H~C03BH are documented as RC3.
 *       C060H~C08BH follow the same structural pattern as
 *       B060H~B08BH (RC2), therefore inferred as RC4.
 * ============================================================ */
 /* -------------------- System / Common -------------------- */
#define BR08_PRO_HW_CODE_SUCCESS										0x0000	/* Success */
#define BR08_PRO_HW_CODE_BILL_IN_CHANNEL								0x0010	/* Bill detected in channel */

/* -------------------- Motor / Mechanism -------------------- */
#define BR08_PRO_HW_CODE_MAIN_MOTOR_FORWARD_FAIL						0x3000	/* Main motor forward failed */
#define BR08_PRO_HW_CODE_MAIN_MOTOR_REVERSE_FAIL						0x3001	/* Main motor reverse failed */
#define BR08_PRO_HW_CODE_BILL_IN_CHANNEL_WHEN_READY					0x3201	/* Bill in channel when ready */
#define BR08_PRO_HW_CODE_BILL_IN_CHANNEL_INIT							0x4001	/* Bill in channel at init */
#define BR08_PRO_HW_CODE_CASH_BOX_DETECT_ERROR_INIT					0x4002	/* Cash box detect error at init */
#define BR08_PRO_HW_CODE_ALIGN_RIGHT_SENSOR_ERROR_INIT					0x4005	/* Right align sensor error at init */
#define BR08_PRO_HW_CODE_ALIGN_LEFT_SENSOR_ERROR_INIT					0x4006	/* Left align sensor error at init */
#define BR08_PRO_HW_CODE_CALIBRATION_FAIL								0x5000	/* Calibration failed */
#define BR08_PRO_HW_CODE_ALIGN_NOT_HOME_WHEN_JAM						0x8001	/* Not at home position when jammed */
#define BR08_PRO_HW_CODE_BILL_ENTER_CASH_BOX_FAIL						0x8005	/* Bill failed to enter cash box */
#define BR08_PRO_HW_CODE_BILL_EXIT_CASH_BOX_WHEN_PRESS					0x8006	/* Bill exited cash box when pressed */
#define BR08_PRO_HW_CODE_CASH_BOX_FULL									0x8007	/* Cash box full */
#define BR08_PRO_HW_CODE_BILL_JAM_IN_CHANNEL							0x8009	/* Bill jammed in channel */
#define BR08_PRO_HW_CODE_BILL_IN_CHANNEL_AFTER_PRESS					0x8020	/* Bill in channel after press */
#define BR08_PRO_HW_CODE_SUSPICIOUS_DISPENSE							0x8023	/* Suspicious dispense */

/* -------------------- Drum / Cassette -------------------- */
#define BR08_PRO_HW_CODE_DRUM_OFFLINE									0xA001	/* Drum offline */
#define BR08_PRO_HW_CODE_DRUM_EXEC_TIMEOUT								0xA002	/* Drum operation timeout */
#define BR08_PRO_HW_CODE_RC1_ENTRY_TIMEOUT_NOT_BLOCKED					0xA010	/* RC1 entry timeout, not blocked */
#define BR08_PRO_HW_CODE_RC1_ENTRY_TIMEOUT_NOT_CLEARED					0xA011	/* RC1 entry timeout, not cleared */
#define BR08_PRO_HW_CODE_RC2_ENTRY_TIMEOUT_NOT_BLOCKED					0xA012	/* RC2 entry timeout, not blocked */
#define BR08_PRO_HW_CODE_RC2_ENTRY_TIMEOUT_NOT_CLEARED					0xA013	/* RC2 entry timeout, not cleared */
#define BR08_PRO_HW_CODE_UNKNOWN_BILL_BLOCK_RC2							0xA014	/* Unknown bill blocked at RC2 */
#define BR08_PRO_HW_CODE_LOWER_ENTRY_TIMEOUT_NOT_BLOCKED				0xA015	/* Lower entry timeout, not blocked */
#define BR08_PRO_HW_CODE_RCM1_INOUT_TIMEOUT								0xA016	/* RM1 in/out timeout */
#define BR08_PRO_HW_CODE_RCM2_INOUT_TIMEOUT								0xA017	/* RM2 in/out timeout */
#define BR08_PRO_HW_CODE_UNKNOWN_BILL_REACH_UPPER_CHANNEL				0xA01A	/* Unknown bill reached upper channel */
#define BR08_PRO_HW_CODE_UNKNOWN_BILL_REACH_REJECT_CHANNEL				0xA01B	/* Unknown bill reached reject channel */
#define BR08_PRO_HW_CODE_REJECT_CHANNEL_TIMEOUT_NOT_CLEARED				0xA01C	/* Reject channel timeout, not cleared */
#define BR08_PRO_HW_CODE_DEPOSITED_BILL_PULLED_OUT						0xA01D	/* Deposited bill pulled out */

/* -------------------- RM1 / RM2 Module -------------------- */
#define BR08_PRO_HW_CODE_RM1_NOT_INITIALIZED							0xB001	/* RM1 not initialized */
#define BR08_PRO_HW_CODE_RM2_NOT_INITIALIZED							0xC001	/* RM2 not initialized */
#define BR08_PRO_HW_CODE_RM1_CMD_PARAM_ERROR							0xB002	/* RM1 command parameter error */
#define BR08_PRO_HW_CODE_RM2_CMD_PARAM_ERROR							0xC002	/* RM2 command parameter error */
#define BR08_PRO_HW_CODE_RM1_DRUM_COUNT_NOT_ZERO						0xB003	/* RM1 drum count not zero */
#define BR08_PRO_HW_CODE_RM2_DRUM_COUNT_NOT_ZERO						0xC003	/* RM2 drum count not zero */
#define BR08_PRO_HW_CODE_RM1_MAIN_CHANNEL_JAM							0xB004	/* RM1 main channel jam */
#define BR08_PRO_HW_CODE_RM2_MAIN_CHANNEL_JAM							0xC004	/* RM2 main channel jam */
#define BR08_PRO_HW_CODE_RM1_SMALL_MARK_OVERRUN							0xB005	/* RM1 small mark overrun */
#define BR08_PRO_HW_CODE_RM2_SMALL_MARK_OVERRUN							0xC005	/* RM2 small mark overrun */
#define BR08_PRO_HW_CODE_RM1_BILL_DEST_ERROR							0xB006	/* RM1 bill destination error */
#define BR08_PRO_HW_CODE_RM2_BILL_DEST_ERROR							0xC006	/* RM2 bill destination error */
#define BR08_PRO_HW_CODE_RM1_LOCK_STATUS_ERROR							0xB007	/* RM1 lock status error */
#define BR08_PRO_HW_CODE_RM2_LOCK_STATUS_ERROR							0xC007	/* RM2 lock status error */
#define BR08_PRO_HW_CODE_RM1_PARAM_ERROR								0xB008	/* RM1 parameter error */
#define BR08_PRO_HW_CODE_RM2_PARAM_ERROR								0xC008	/* RM2 parameter error */

/* -------------------- RC1 (B010H~B03BH) -------------------- */
#define BR08_PRO_HW_CODE_RC1_ENTRY_SENSOR_ERROR							0xB010	/* RC1 entry sensor error */
#define BR08_PRO_HW_CODE_RC1_READ_COUNT_ERROR							0xB011	/* RC1 read count error */
#define BR08_PRO_HW_CODE_RC1_SET_COUNT_ERROR							0xB012	/* RC1 set count error */
#define BR08_PRO_HW_CODE_RC1_READ_TYPE_ERROR							0xB013	/* RC1 read type error */
#define BR08_PRO_HW_CODE_RC1_SET_TYPE_ERROR								0xB014	/* RC1 set type error */
#define BR08_PRO_HW_CODE_RC1_MOTOR_STALL								0xB015	/* RC1 motor stall */
#define BR08_PRO_HW_CODE_RC1_CMD_TIMEOUT								0xB016	/* RC1 command timeout */
#define BR08_PRO_HW_CODE_RC1_DEPOSIT_TIMEOUT_NOT_REACH_ENTRY			0xB017	/* RC1 deposit timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC1_SHORT_BILL									0xB018	/* RC1 short bill */
#define BR08_PRO_HW_CODE_RC1_DISPENSE_TIMEOUT_NOT_REACH_ENTRY			0xB019	/* RC1 dispense timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC1_DRUM_FULL									0xB01A	/* RC1 drum full */
#define BR08_PRO_HW_CODE_RC1_DRUM_EMPTY									0xB01B	/* RC1 drum empty */
#define BR08_PRO_HW_CODE_RC1_TAPE_ERROR									0xB01C	/* RC1 tape error */
#define BR08_PRO_HW_CODE_RC1_COUNT_ERROR_TAPE_EMPTY_COUNT_NONZERO		0xB01D	/* RC1 count error: tape empty but count non-zero */
#define BR08_PRO_HW_CODE_RC1_COUNT_ERROR_ZERO_COUNT_BILL_DETECTED		0xB01E	/* RC1 count error: zero count but bill detected */
#define BR08_PRO_HW_CODE_RC1_NO_UNDEPOSITED_BILL_CANNOT_CANCEL			0xB01F	/* RC1 no undeposited bill, cannot cancel */
#define BR08_PRO_HW_CODE_RC1_HAS_UNDEPOSITED_BILL_CANNOT_CHANGE		0xB020	/* RC1 has undeposited bill, cannot change */
#define BR08_PRO_HW_CODE_RC1_LARGE_MARK_ERROR							0xB021	/* RC1 large mark error */
#define BR08_PRO_HW_CODE_RC1_SMALL_MARK_ERROR							0xB022	/* RC1 small mark error */
#define BR08_PRO_HW_CODE_RC1_DISPENSE_ENTRY_SENSOR_ERROR				0xB023	/* RC1 dispense entry sensor error */
#define BR08_PRO_HW_CODE_RC1_FIND_MARK_TIMEOUT						0xB024	/* RC1 find mark timeout */
#define BR08_PRO_HW_CODE_RC1_MARK_OVERRUN_ENTRY_SENSOR_BLOCKED		0xB025	/* RC1 mark overrun, entry sensor blocked */
#define BR08_PRO_HW_CODE_RC1_DEPOSIT_ENTRY_SENSOR_ERROR				0xB026	/* RC1 deposit entry sensor error */
#define BR08_PRO_HW_CODE_RC1_MARK_NOT_FOUND							0xB027	/* RC1 mark not found */
#define BR08_PRO_HW_CODE_RC1_MARK_LENGTH_ERROR						0xB028	/* RC1 mark length error */
#define BR08_PRO_HW_CODE_RC1_DRUM_EMPTY_SETTLE_ERROR					0xB029	/* RC1 drum empty settle error */
#define BR08_PRO_HW_CODE_RC1_DISPENSE_LOCATE_TIMEOUT					0xB02A	/* RC1 dispense locate timeout */
#define BR08_PRO_HW_CODE_RC1_INIT_FLOW_ERROR							0xB02B	/* RC1 init flow error */
#define BR08_PRO_HW_CODE_RC1_INIT_FAIL_LARGE_MARK_OR_SENSOR			0xB02C	/* RC1 init fail: large mark or sensor */
#define BR08_PRO_HW_CODE_RC1_DRUM_PHYSICALLY_FULL						0xB02D	/* RC1 drum physically full */
#define BR08_PRO_HW_CODE_RC1_DRUM_PHYSICALLY_EMPTY					0xB02E	/* RC1 drum physically empty */
#define BR08_PRO_HW_CODE_RC1_LOCATE_ENTRY_HAS_BILL					0xB02F	/* RC1 locate: entry has bill */
#define BR08_PRO_HW_CODE_RC1_LOCATE_TRANSFER_TIMEOUT					0xB030	/* RC1 locate transfer timeout */
#define BR08_PRO_HW_CODE_RC1_LOCATE_DEPOSIT_TIMEOUT_ENTRY_HAS_BILL	0xB031	/* RC1 locate deposit timeout, entry has bill */
#define BR08_PRO_HW_CODE_RC1_COUNT_ERROR_ZERO_COUNT_DRUM_FULL			0xB032	/* RC1 count error: zero count but drum full */
#define BR08_PRO_HW_CODE_RC1_LOCATE_DEPOSIT_TIMEOUT_MARK_SENSOR_ERROR	0xB033	/* RC1 locate deposit timeout, mark sensor error */
#define BR08_PRO_HW_CODE_RC1_DEPOSIT_ENTRY_SENSOR_DOUBLE_TRIGGER		0xB034	/* RC1 deposit entry sensor double trigger */
#define BR08_PRO_HW_CODE_RC1_INIT_DEPOSIT_DIR_ENTRY_HAS_BILL			0xB035	/* RC1 init: deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC1_INIT_EMPTY_DEPOSIT_DIR_ENTRY_HAS_BILL	0xB036	/* RC1 init: empty deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC1_BILL_TOO_SHORT							0xB037	/* RC1 bill too short */
#define BR08_PRO_HW_CODE_RC1_DEPOSIT_DRUM2_ENTRY_DIVERTER_FAIL		0xB038	/* RC1 deposit drum2 entry diverter fail */
#define BR08_PRO_HW_CODE_RC1_DISPENSE_DRUM2_TO_DRUM1_JAM				0xB039	/* RC1 dispense drum2->drum1 jam */
#define BR08_PRO_HW_CODE_RC1_DISPENSE_ENTRY_SENSOR_NOT_CLEARED		0xB03A	/* RC1 dispense entry sensor not cleared */
#define BR08_PRO_HW_CODE_RC1_FISHING_EVENT							0xB03B	/* RC1 fishing event */

/* -------------------- RC2 (B060H~B08BH) -------------------- */
#define BR08_PRO_HW_CODE_RC2_ENTRY_SENSOR_ERROR						0xB060	/* RC2 entry sensor error */
#define BR08_PRO_HW_CODE_RC2_READ_COUNT_ERROR							0xB061	/* RC2 read count error */
#define BR08_PRO_HW_CODE_RC2_SET_COUNT_ERROR							0xB062	/* RC2 set count error */
#define BR08_PRO_HW_CODE_RC2_READ_TYPE_ERROR							0xB063	/* RC2 read type error */
#define BR08_PRO_HW_CODE_RC2_SET_TYPE_ERROR							0xB064	/* RC2 set type error */
#define BR08_PRO_HW_CODE_RC2_MOTOR_STALL								0xB065	/* RC2 motor stall */
#define BR08_PRO_HW_CODE_RC2_CMD_TIMEOUT								0xB066	/* RC2 command timeout */
#define BR08_PRO_HW_CODE_RC2_DEPOSIT_TIMEOUT_NOT_REACH_ENTRY			0xB067	/* RC2 deposit timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC2_SHORT_BILL								0xB068	/* RC2 short bill */
#define BR08_PRO_HW_CODE_RC2_DISPENSE_TIMEOUT_NOT_REACH_ENTRY			0xB069	/* RC2 dispense timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC2_DRUM_FULL								0xB06A	/* RC2 drum full */
#define BR08_PRO_HW_CODE_RC2_DRUM_EMPTY								0xB06B	/* RC2 drum empty */
#define BR08_PRO_HW_CODE_RC2_TAPE_ERROR								0xB06C	/* RC2 tape error */
#define BR08_PRO_HW_CODE_RC2_COUNT_ERROR_TAPE_EMPTY_COUNT_NONZERO		0xB06D	/* RC2 count error: tape empty but count non-zero */
#define BR08_PRO_HW_CODE_RC2_COUNT_ERROR_ZERO_COUNT_BILL_DETECTED		0xB06E	/* RC2 count error: zero count but bill detected */
#define BR08_PRO_HW_CODE_RC2_NO_UNDEPOSITED_BILL_CANNOT_CANCEL		0xB06F	/* RC2 no undeposited bill, cannot cancel */
#define BR08_PRO_HW_CODE_RC2_HAS_UNDEPOSITED_BILL_CANNOT_CHANGE		0xB070	/* RC2 has undeposited bill, cannot change */
#define BR08_PRO_HW_CODE_RC2_LARGE_MARK_ERROR							0xB071	/* RC2 large mark error */
#define BR08_PRO_HW_CODE_RC2_SMALL_MARK_ERROR							0xB072	/* RC2 small mark error */
#define BR08_PRO_HW_CODE_RC2_DISPENSE_ENTRY_SENSOR_ERROR				0xB073	/* RC2 dispense entry sensor error */
#define BR08_PRO_HW_CODE_RC2_FIND_MARK_TIMEOUT						0xB074	/* RC2 find mark timeout */
#define BR08_PRO_HW_CODE_RC2_MARK_OVERRUN_ENTRY_SENSOR_BLOCKED		0xB075	/* RC2 mark overrun, entry sensor blocked */
#define BR08_PRO_HW_CODE_RC2_DEPOSIT_ENTRY_SENSOR_ERROR				0xB076	/* RC2 deposit entry sensor error */
#define BR08_PRO_HW_CODE_RC2_MARK_NOT_FOUND							0xB077	/* RC2 mark not found */
#define BR08_PRO_HW_CODE_RC2_MARK_LENGTH_ERROR						0xB078	/* RC2 mark length error */
#define BR08_PRO_HW_CODE_RC2_DRUM_EMPTY_SETTLE_ERROR					0xB079	/* RC2 drum empty settle error */
#define BR08_PRO_HW_CODE_RC2_DISPENSE_LOCATE_TIMEOUT					0xB07A	/* RC2 dispense locate timeout */
#define BR08_PRO_HW_CODE_RC2_INIT_FLOW_ERROR							0xB07B	/* RC2 init flow error */
#define BR08_PRO_HW_CODE_RC2_INIT_FAIL_LARGE_MARK_OR_SENSOR			0xB07C	/* RC2 init fail: large mark or sensor */
#define BR08_PRO_HW_CODE_RC2_DRUM_PHYSICALLY_FULL						0xB07D	/* RC2 drum physically full */
#define BR08_PRO_HW_CODE_RC2_DRUM_PHYSICALLY_EMPTY					0xB07E	/* RC2 drum physically empty */
#define BR08_PRO_HW_CODE_RC2_LOCATE_ENTRY_HAS_BILL					0xB07F	/* RC2 locate: entry has bill */
#define BR08_PRO_HW_CODE_RC2_LOCATE_TRANSFER_TIMEOUT					0xB080	/* RC2 locate transfer timeout */
#define BR08_PRO_HW_CODE_RC2_LOCATE_DEPOSIT_TIMEOUT_ENTRY_HAS_BILL	0xB081	/* RC2 locate deposit timeout, entry has bill */
#define BR08_PRO_HW_CODE_RC2_COUNT_ERROR_ZERO_COUNT_DRUM_FULL			0xB082	/* RC2 count error: zero count but drum full */
#define BR08_PRO_HW_CODE_RC2_LOCATE_DEPOSIT_TIMEOUT_MARK_SENSOR_ERROR	0xB083	/* RC2 locate deposit timeout, mark sensor error */
#define BR08_PRO_HW_CODE_RC2_DEPOSIT_ENTRY_SENSOR_DOUBLE_TRIGGER		0xB084	/* RC2 deposit entry sensor double trigger */
#define BR08_PRO_HW_CODE_RC2_INIT_DEPOSIT_DIR_ENTRY_HAS_BILL			0xB085	/* RC2 init: deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC2_INIT_EMPTY_DEPOSIT_DIR_ENTRY_HAS_BILL	0xB086	/* RC2 init: empty deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC2_BILL_TOO_SHORT							0xB087	/* RC2 bill too short */
#define BR08_PRO_HW_CODE_RC2_DEPOSIT_DRUM2_ENTRY_DIVERTER_FAIL		0xB088	/* RC2 deposit drum2 entry diverter fail */
#define BR08_PRO_HW_CODE_RC2_DISPENSE_DRUM2_TO_DRUM1_JAM				0xB089	/* RC2 dispense drum2->drum1 jam */
#define BR08_PRO_HW_CODE_RC2_DISPENSE_ENTRY_SENSOR_NOT_CLEARED		0xB08A	/* RC2 dispense entry sensor not cleared */
#define BR08_PRO_HW_CODE_RC2_FISHING_EVENT							0xB08B	/* RC2 fishing event */

/* -------------------- RC3 (C010H~C03BH) -------------------- */
#define BR08_PRO_HW_CODE_RC3_ENTRY_SENSOR_ERROR						0xC010	/* RC3 entry sensor error */
#define BR08_PRO_HW_CODE_RC3_READ_COUNT_ERROR							0xC011	/* RC3 read count error */
#define BR08_PRO_HW_CODE_RC3_SET_COUNT_ERROR							0xC012	/* RC3 set count error */
#define BR08_PRO_HW_CODE_RC3_READ_TYPE_ERROR							0xC013	/* RC3 read type error */
#define BR08_PRO_HW_CODE_RC3_SET_TYPE_ERROR							0xC014	/* RC3 set type error */
#define BR08_PRO_HW_CODE_RC3_MOTOR_STALL								0xC015	/* RC3 motor stall */
#define BR08_PRO_HW_CODE_RC3_CMD_TIMEOUT								0xC016	/* RC3 command timeout */
#define BR08_PRO_HW_CODE_RC3_DEPOSIT_TIMEOUT_NOT_REACH_ENTRY			0xC017	/* RC3 deposit timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC3_SHORT_BILL								0xC018	/* RC3 short bill */
#define BR08_PRO_HW_CODE_RC3_DISPENSE_TIMEOUT_NOT_REACH_ENTRY			0xC019	/* RC3 dispense timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC3_DRUM_FULL								0xC01A	/* RC3 drum full */
#define BR08_PRO_HW_CODE_RC3_DRUM_EMPTY								0xC01B	/* RC3 drum empty */
#define BR08_PRO_HW_CODE_RC3_TAPE_ERROR								0xC01C	/* RC3 tape error */
#define BR08_PRO_HW_CODE_RC3_COUNT_ERROR_TAPE_EMPTY_COUNT_NONZERO		0xC01D	/* RC3 count error: tape empty but count non-zero */
#define BR08_PRO_HW_CODE_RC3_COUNT_ERROR_ZERO_COUNT_BILL_DETECTED		0xC01E	/* RC3 count error: zero count but bill detected */
#define BR08_PRO_HW_CODE_RC3_NO_UNDEPOSITED_BILL_CANNOT_CANCEL		0xC01F	/* RC3 no undeposited bill, cannot cancel */
#define BR08_PRO_HW_CODE_RC3_HAS_UNDEPOSITED_BILL_CANNOT_CHANGE		0xC020	/* RC3 has undeposited bill, cannot change */
#define BR08_PRO_HW_CODE_RC3_LARGE_MARK_ERROR							0xC021	/* RC3 large mark error */
#define BR08_PRO_HW_CODE_RC3_SMALL_MARK_ERROR							0xC022	/* RC3 small mark error */
#define BR08_PRO_HW_CODE_RC3_DISPENSE_ENTRY_SENSOR_ERROR				0xC023	/* RC3 dispense entry sensor error */
#define BR08_PRO_HW_CODE_RC3_FIND_MARK_TIMEOUT						0xC024	/* RC3 find mark timeout */
#define BR08_PRO_HW_CODE_RC3_MARK_OVERRUN_ENTRY_SENSOR_BLOCKED		0xC025	/* RC3 mark overrun, entry sensor blocked */
#define BR08_PRO_HW_CODE_RC3_DEPOSIT_ENTRY_SENSOR_ERROR				0xC026	/* RC3 deposit entry sensor error */
#define BR08_PRO_HW_CODE_RC3_MARK_NOT_FOUND							0xC027	/* RC3 mark not found */
#define BR08_PRO_HW_CODE_RC3_MARK_LENGTH_ERROR						0xC028	/* RC3 mark length error */
#define BR08_PRO_HW_CODE_RC3_DRUM_EMPTY_SETTLE_ERROR					0xC029	/* RC3 drum empty settle error */
#define BR08_PRO_HW_CODE_RC3_DISPENSE_LOCATE_TIMEOUT					0xC02A	/* RC3 dispense locate timeout */
#define BR08_PRO_HW_CODE_RC3_INIT_FLOW_ERROR							0xC02B	/* RC3 init flow error */
#define BR08_PRO_HW_CODE_RC3_INIT_FAIL_LARGE_MARK_OR_SENSOR			0xC02C	/* RC3 init fail: large mark or sensor */
#define BR08_PRO_HW_CODE_RC3_DRUM_PHYSICALLY_FULL						0xC02D	/* RC3 drum physically full */
#define BR08_PRO_HW_CODE_RC3_DRUM_PHYSICALLY_EMPTY					0xC02E	/* RC3 drum physically empty */
#define BR08_PRO_HW_CODE_RC3_LOCATE_ENTRY_HAS_BILL					0xC02F	/* RC3 locate: entry has bill */
#define BR08_PRO_HW_CODE_RC3_LOCATE_TRANSFER_TIMEOUT					0xC030	/* RC3 locate transfer timeout */
#define BR08_PRO_HW_CODE_RC3_LOCATE_DEPOSIT_TIMEOUT_ENTRY_HAS_BILL	0xC031	/* RC3 locate deposit timeout, entry has bill */
#define BR08_PRO_HW_CODE_RC3_COUNT_ERROR_ZERO_COUNT_DRUM_FULL			0xC032	/* RC3 count error: zero count but drum full */
#define BR08_PRO_HW_CODE_RC3_LOCATE_DEPOSIT_TIMEOUT_MARK_SENSOR_ERROR	0xC033	/* RC3 locate deposit timeout, mark sensor error */
#define BR08_PRO_HW_CODE_RC3_DEPOSIT_ENTRY_SENSOR_DOUBLE_TRIGGER		0xC034	/* RC3 deposit entry sensor double trigger */
#define BR08_PRO_HW_CODE_RC3_INIT_DEPOSIT_DIR_ENTRY_HAS_BILL			0xC035	/* RC3 init: deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC3_INIT_EMPTY_DEPOSIT_DIR_ENTRY_HAS_BILL	0xC036	/* RC3 init: empty deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC3_BILL_TOO_SHORT							0xC037	/* RC3 bill too short */
#define BR08_PRO_HW_CODE_RC3_DEPOSIT_DRUM2_ENTRY_DIVERTER_FAIL		0xC038	/* RC3 deposit drum2 entry diverter fail */
#define BR08_PRO_HW_CODE_RC3_DISPENSE_DRUM2_TO_DRUM1_JAM				0xC039	/* RC3 dispense drum2->drum1 jam */
#define BR08_PRO_HW_CODE_RC3_DISPENSE_ENTRY_SENSOR_NOT_CLEARED		0xC03A	/* RC3 dispense entry sensor not cleared */
#define BR08_PRO_HW_CODE_RC3_FISHING_EVENT							0xC03B	/* RC3 fishing event */

/* -------------------- RC4 (C060H~C08BH) -------------------- */
#define BR08_PRO_HW_CODE_RC4_ENTRY_SENSOR_ERROR						0xC060	/* RC4 entry sensor error */
#define BR08_PRO_HW_CODE_RC4_READ_COUNT_ERROR							0xC061	/* RC4 read count error */
#define BR08_PRO_HW_CODE_RC4_SET_COUNT_ERROR							0xC062	/* RC4 set count error */
#define BR08_PRO_HW_CODE_RC4_READ_TYPE_ERROR							0xC063	/* RC4 read type error */
#define BR08_PRO_HW_CODE_RC4_SET_TYPE_ERROR							0xC064	/* RC4 set type error */
#define BR08_PRO_HW_CODE_RC4_MOTOR_STALL								0xC065	/* RC4 motor stall */
#define BR08_PRO_HW_CODE_RC4_CMD_TIMEOUT								0xC066	/* RC4 command timeout */
#define BR08_PRO_HW_CODE_RC4_DEPOSIT_TIMEOUT_NOT_REACH_ENTRY			0xC067	/* RC4 deposit timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC4_SHORT_BILL								0xC068	/* RC4 short bill */
#define BR08_PRO_HW_CODE_RC4_DISPENSE_TIMEOUT_NOT_REACH_ENTRY			0xC069	/* RC4 dispense timeout, did not reach entry */
#define BR08_PRO_HW_CODE_RC4_DRUM_FULL								0xC06A	/* RC4 drum full */
#define BR08_PRO_HW_CODE_RC4_DRUM_EMPTY								0xC06B	/* RC4 drum empty */
#define BR08_PRO_HW_CODE_RC4_TAPE_ERROR								0xC06C	/* RC4 tape error */
#define BR08_PRO_HW_CODE_RC4_COUNT_ERROR_TAPE_EMPTY_COUNT_NONZERO		0xC06D	/* RC4 count error: tape empty but count non-zero */
#define BR08_PRO_HW_CODE_RC4_COUNT_ERROR_ZERO_COUNT_BILL_DETECTED		0xC06E	/* RC4 count error: zero count but bill detected */
#define BR08_PRO_HW_CODE_RC4_NO_UNDEPOSITED_BILL_CANNOT_CANCEL		0xC06F	/* RC4 no undeposited bill, cannot cancel */
#define BR08_PRO_HW_CODE_RC4_HAS_UNDEPOSITED_BILL_CANNOT_CHANGE		0xC070	/* RC4 has undeposited bill, cannot change */
#define BR08_PRO_HW_CODE_RC4_LARGE_MARK_ERROR							0xC071	/* RC4 large mark error */
#define BR08_PRO_HW_CODE_RC4_SMALL_MARK_ERROR							0xC072	/* RC4 small mark error */
#define BR08_PRO_HW_CODE_RC4_DISPENSE_ENTRY_SENSOR_ERROR				0xC073	/* RC4 dispense entry sensor error */
#define BR08_PRO_HW_CODE_RC4_FIND_MARK_TIMEOUT						0xC074	/* RC4 find mark timeout */
#define BR08_PRO_HW_CODE_RC4_MARK_OVERRUN_ENTRY_SENSOR_BLOCKED		0xC075	/* RC4 mark overrun, entry sensor blocked */
#define BR08_PRO_HW_CODE_RC4_DEPOSIT_ENTRY_SENSOR_ERROR				0xC076	/* RC4 deposit entry sensor error */
#define BR08_PRO_HW_CODE_RC4_MARK_NOT_FOUND							0xC077	/* RC4 mark not found */
#define BR08_PRO_HW_CODE_RC4_MARK_LENGTH_ERROR						0xC078	/* RC4 mark length error */
#define BR08_PRO_HW_CODE_RC4_DRUM_EMPTY_SETTLE_ERROR					0xC079	/* RC4 drum empty settle error */
#define BR08_PRO_HW_CODE_RC4_DISPENSE_LOCATE_TIMEOUT					0xC07A	/* RC4 dispense locate timeout */
#define BR08_PRO_HW_CODE_RC4_INIT_FLOW_ERROR							0xC07B	/* RC4 init flow error */
#define BR08_PRO_HW_CODE_RC4_INIT_FAIL_LARGE_MARK_OR_SENSOR			0xC07C	/* RC4 init fail: large mark or sensor */
#define BR08_PRO_HW_CODE_RC4_DRUM_PHYSICALLY_FULL						0xC07D	/* RC4 drum physically full */
#define BR08_PRO_HW_CODE_RC4_DRUM_PHYSICALLY_EMPTY					0xC07E	/* RC4 drum physically empty */
#define BR08_PRO_HW_CODE_RC4_LOCATE_ENTRY_HAS_BILL					0xC07F	/* RC4 locate: entry has bill */
#define BR08_PRO_HW_CODE_RC4_LOCATE_TRANSFER_TIMEOUT					0xC080	/* RC4 locate transfer timeout */
#define BR08_PRO_HW_CODE_RC4_LOCATE_DEPOSIT_TIMEOUT_ENTRY_HAS_BILL	0xC081	/* RC4 locate deposit timeout, entry has bill */
#define BR08_PRO_HW_CODE_RC4_COUNT_ERROR_ZERO_COUNT_DRUM_FULL			0xC082	/* RC4 count error: zero count but drum full */
#define BR08_PRO_HW_CODE_RC4_LOCATE_DEPOSIT_TIMEOUT_MARK_SENSOR_ERROR	0xC083	/* RC4 locate deposit timeout, mark sensor error */
#define BR08_PRO_HW_CODE_RC4_DEPOSIT_ENTRY_SENSOR_DOUBLE_TRIGGER		0xC084	/* RC4 deposit entry sensor double trigger */
#define BR08_PRO_HW_CODE_RC4_INIT_DEPOSIT_DIR_ENTRY_HAS_BILL			0xC085	/* RC4 init: deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC4_INIT_EMPTY_DEPOSIT_DIR_ENTRY_HAS_BILL	0xC086	/* RC4 init: empty deposit dir entry has bill */
#define BR08_PRO_HW_CODE_RC4_BILL_TOO_SHORT							0xC087	/* RC4 bill too short */
#define BR08_PRO_HW_CODE_RC4_DEPOSIT_DRUM2_ENTRY_DIVERTER_FAIL		0xC088	/* RC4 deposit drum2 entry diverter fail */
#define BR08_PRO_HW_CODE_RC4_DISPENSE_DRUM2_TO_DRUM1_JAM				0xC089	/* RC4 dispense drum2->drum1 jam */
#define BR08_PRO_HW_CODE_RC4_DISPENSE_ENTRY_SENSOR_NOT_CLEARED		0xC08A	/* RC4 dispense entry sensor not cleared */
#define BR08_PRO_HW_CODE_RC4_FISHING_EVENT							0xC08B	/* RC4 fishing event */
/******************HW_CODE END****************************************/

/******************CUR_CODE START****************************************/
#define BR08_PRO_CUR_CODE_USD  0x01
#define BR08_PRO_CUR_DESC_USD  "USD" //United States Dollar

#define BR08_PRO_CUR_CODE_AUD  0x02
#define BR08_PRO_CUR_DESC_AUD  "AUD" //Australian Dollar

#define BR08_PRO_CUR_CODE_SEK  0x05
#define BR08_PRO_CUR_DESC_SEK  "SEK" //Swiss Franc

#define BR08_PRO_CUR_CODE_ZAR  0x06
#define BR08_PRO_CUR_DESC_ZAR  "ZAR" //South African Rand

#define BR08_PRO_CUR_CODE_NOK  0x07
#define BR08_PRO_CUR_DESC_NOK  "NOK" //Norwegian Krone

#define BR08_PRO_CUR_CODE_CAD  0x08
#define BR08_PRO_CUR_DESC_CAD  "CAD" //Canadian Dollar

#define BR08_PRO_CUR_CODE_MXN  0x09
#define BR08_PRO_CUR_DESC_MXN  "MXN" //Mexican Peso

#define BR08_PRO_CUR_CODE_JPY  0x0A
#define BR08_PRO_CUR_DESC_JPY  "JPY" //Japanese Yen

#define BR08_PRO_CUR_CODE_BRL  0x0C
#define BR08_PRO_CUR_DESC_BRL  "BRL" //Brazilian Real

#define BR08_PRO_CUR_CODE_NZD  0x0D
#define BR08_PRO_CUR_DESC_NZD  "NZD" //New Zealand Dollar

#define BR08_PRO_CUR_CODE_ARS  0x0E
#define BR08_PRO_CUR_DESC_ARS  "ARS" //Argentine Peso

#define BR08_PRO_CUR_CODE_BBD  0x10
#define BR08_PRO_CUR_DESC_BBD  "BBD" //Barbadian Dollar

#define BR08_PRO_CUR_CODE_TTD  0x11
#define BR08_PRO_CUR_DESC_TTD  "TTD" //Trinidad and Tobago Dollar

#define BR08_PRO_CUR_CODE_THB  0x12
#define BR08_PRO_CUR_DESC_THB  "THB" //Thai Baht

#define BR08_PRO_CUR_CODE_KRW  0x15
#define BR08_PRO_CUR_DESC_KRW  "KRW" //South Korean Won

#define BR08_PRO_CUR_CODE_CHF  0x16
#define BR08_PRO_CUR_DESC_CHF  "CHF" //Swiss Franc

#define BR08_PRO_CUR_CODE_GBP  0x17
#define BR08_PRO_CUR_DESC_GBP  "GBP" //Pound Sterling

#define BR08_PRO_CUR_CODE_COP  0x19
#define BR08_PRO_CUR_DESC_COP  "COP" //Colombian Peso

#define BR08_PRO_CUR_CODE_PLN  0x1A
#define BR08_PRO_CUR_DESC_PLN  "PLN" //Polish Zloty

#define BR08_PRO_CUR_CODE_AED  0x1C
#define BR08_PRO_CUR_DESC_AED  "AED" //United Arab Emirates Dirham

#define BR08_PRO_CUR_CODE_TWD  0x1D
#define BR08_PRO_CUR_DESC_TWD  "TWD" //New Taiwan Dollar

#define BR08_PRO_CUR_CODE_VES  0x1F
#define BR08_PRO_CUR_DESC_VES  "VES" //Venezuelan Bolívar

#define BR08_PRO_CUR_CODE_MYR  0x21
#define BR08_PRO_CUR_DESC_MYR  "MYR" //Malaysia

#define BR08_PRO_CUR_CODE_SGD  0x22
#define BR08_PRO_CUR_DESC_SGD  "SGD" //Singapore

#define BR08_PRO_CUR_CODE_GIP  0x26
#define BR08_PRO_CUR_DESC_GIP  "GIP" //England/Gibraltar

#define BR08_PRO_CUR_CODE_RUB  0x27
#define BR08_PRO_CUR_DESC_RUB  "RUB" //Russia

#define BR08_PRO_CUR_CODE_CZK  0x2C
#define BR08_PRO_CUR_DESC_CZK  "CZK" //Czech Republic

#define BR08_PRO_CUR_CODE_CNY  0x2D
#define BR08_PRO_CUR_DESC_CNY  "CNY" //China

#define BR08_PRO_CUR_CODE_PEN  0x2F
#define BR08_PRO_CUR_DESC_PEN  "PEN" //Peru

#define BR08_PRO_CUR_CODE_HUF  0x30
#define BR08_PRO_CUR_DESC_HUF  "HUF" //Hungary

#define BR08_PRO_CUR_CODE_UYU  0x31
#define BR08_PRO_CUR_DESC_UYU  "UYU" //Uruguay

#define BR08_PRO_CUR_CODE_DKK  0x3A
#define BR08_PRO_CUR_DESC_DKK  "DKK" //Denmark

#define BR08_PRO_CUR_CODE_NAD  0x3B
#define BR08_PRO_CUR_DESC_NAD  "NAD" //Namibia

#define BR08_PRO_CUR_CODE_QAR  0x42
#define BR08_PRO_CUR_DESC_QAR  "QAR" //Qatar

#define BR08_PRO_CUR_CODE_IMP  0x44
#define BR08_PRO_CUR_DESC_IMP  "IMP" //Isle of Man

#define BR08_PRO_CUR_CODE_MUR  0x47
#define BR08_PRO_CUR_DESC_MUR  "MUR" //Mauritius

#define BR08_PRO_CUR_CODE_ISK  0x49
#define BR08_PRO_CUR_DESC_ISK  "ISK" //Iceland

#define BR08_PRO_CUR_CODE_PHP  0x4A
#define BR08_PRO_CUR_DESC_PHP  "PHP" //Philippines

#define BR08_PRO_CUR_CODE_RON  0x4C
#define BR08_PRO_CUR_DESC_RON  "RON" //Romania

#define BR08_PRO_CUR_CODE_CRC  0x4D
#define BR08_PRO_CUR_DESC_CRC  "CRC" //Costa Rica

#define BR08_PRO_CUR_CODE_CLP  0x4E
#define BR08_PRO_CUR_DESC_CLP  "CLP" //Chile

#define BR08_PRO_CUR_CODE_KZT  0x51
#define BR08_PRO_CUR_DESC_KZT  "KZT" //Kazakhstan

#define BR08_PRO_CUR_CODE_TZS  0x52
#define BR08_PRO_CUR_DESC_TZS  "TZS" //Tanzania

#define BR08_PRO_CUR_CODE_SAR  0x57
#define BR08_PRO_CUR_DESC_SAR  "SAR" //Saudi Arabia

#define BR08_PRO_CUR_CODE_ILS  0x58
#define BR08_PRO_CUR_DESC_ILS  "ILS" //Israel

#define BR08_PRO_CUR_CODE_HKD  0x59
#define BR08_PRO_CUR_DESC_HKD  "HKD" //Hong Kong, China

#define BR08_PRO_CUR_CODE_UAH  0x5C
#define BR08_PRO_CUR_DESC_UAH  "UAH" //Ukraine

#define BR08_PRO_CUR_CODE_BGN  0x5D
#define BR08_PRO_CUR_DESC_BGN  "BGN" //Bulgaria

#define BR08_PRO_CUR_CODE_INR  0x63
#define BR08_PRO_CUR_DESC_INR  "INR" //Indian Rupee

#define BR08_PRO_CUR_CODE_LKR  0x65
#define BR08_PRO_CUR_DESC_LKR  "LKR" //Sri Lankan Rupee

#define BR08_PRO_CUR_CODE_LSL  0x66
#define BR08_PRO_CUR_DESC_LSL  "LSL" //Lesotho Loti

#define BR08_PRO_CUR_CODE_MWK  0x67
#define BR08_PRO_CUR_DESC_MWK  "MWK" //Malawian Kwacha

#define BR08_PRO_CUR_CODE_BYN  0x68
#define BR08_PRO_CUR_DESC_BYN  "BYN" //Belarusian Ruble

#define BR08_PRO_CUR_CODE_SRD  0x69
#define BR08_PRO_CUR_DESC_SRD  "SRD" //Surinamese Dollar

#define BR08_PRO_CUR_CODE_BWP  0x6A
#define BR08_PRO_CUR_DESC_BWP  "BWP" //Botswana Pula

#define BR08_PRO_CUR_CODE_MAD  0x6C
#define BR08_PRO_CUR_DESC_MAD  "MAD" //Moroccan Dirham

#define BR08_PRO_CUR_CODE_GTQ  0x6D
#define BR08_PRO_CUR_DESC_GTQ  "GTQ" //Guatemalan Quetzal

#define BR08_PRO_CUR_CODE_HNL  0x6F
#define BR08_PRO_CUR_DESC_HNL  "HNL" //Honduran Lempira

#define BR08_PRO_CUR_CODE_IDR  0x70
#define BR08_PRO_CUR_DESC_IDR  "IDR" //Indonesian Rupiah

#define BR08_PRO_CUR_CODE_KWD  0x71
#define BR08_PRO_CUR_DESC_KWD  "KWD" //Kuwaiti Dinar

#define BR08_PRO_CUR_CODE_DOP  0x72
#define BR08_PRO_CUR_DESC_DOP  "DOP" //Dominican Peso

#define BR08_PRO_CUR_CODE_MKD  0x73
#define BR08_PRO_CUR_DESC_MKD  "MKD" //North Macedonian Denar

#define BR08_PRO_CUR_CODE_RSD  0x74
#define BR08_PRO_CUR_DESC_RSD  "RSD" //Serbian Dinar

#define BR08_PRO_CUR_CODE_BAM  0x75
#define BR08_PRO_CUR_DESC_BAM  "BAM" //Bosnia and Herzegovina Convertible Mark

#define BR08_PRO_CUR_CODE_GEL  0x76
#define BR08_PRO_CUR_DESC_GEL  "GEL" //Georgian Lari

#define BR08_PRO_CUR_CODE_ALL  0x77
#define BR08_PRO_CUR_DESC_ALL  "ALL" //Albanian Lek

#define BR08_PRO_CUR_CODE_IRR  0x78
#define BR08_PRO_CUR_DESC_IRR  "IRR" //Iranian Rial

#define BR08_PRO_CUR_CODE_SZL  0x79
#define BR08_PRO_CUR_DESC_SZL  "SZL" //Swazi Lilangeni

#define BR08_PRO_CUR_CODE_XOF  0x7A
#define BR08_PRO_CUR_DESC_XOF  "XOF" //West African CFA Franc

#define BR08_PRO_CUR_CODE_TRY  0x7B
#define BR08_PRO_CUR_DESC_TRY  "TRY" //Turkish Lira

#define BR08_PRO_CUR_CODE_AMD  0x7C
#define BR08_PRO_CUR_DESC_AMD  "AMD" //Armenian Dram

#define BR08_PRO_CUR_CODE_OMR  0x7D
#define BR08_PRO_CUR_DESC_OMR  "OMR" //Omani Rial

#define BR08_PRO_CUR_CODE_MDL  0x7E
#define BR08_PRO_CUR_DESC_MDL  "MDL" //Moldovan Leu

#define BR08_PRO_CUR_CODE_ZMW  0x7F
#define BR08_PRO_CUR_DESC_ZMW  "ZMW" //Zambian Kwacha

#define BR08_PRO_CUR_CODE_PKR  0x80
#define BR08_PRO_CUR_DESC_PKR  "PKR" //Pakistani Rupee

#define BR08_PRO_CUR_CODE_TND  0x81
#define BR08_PRO_CUR_DESC_TND  "TND" //Tunisian Dinar

#define BR08_PRO_CUR_CODE_MOP  0x82
#define BR08_PRO_CUR_DESC_MOP  "MOP" //Macanese Pataca

#define BR08_PRO_CUR_CODE_KES  0x83
#define BR08_PRO_CUR_DESC_KES  "KES" //Kenyan Shilling

#define BR08_PRO_CUR_CODE_GMD  0x84
#define BR08_PRO_CUR_DESC_GMD  "GMD" //Gambian Dalasi

#define BR08_PRO_CUR_CODE_NIO  0x85
#define BR08_PRO_CUR_DESC_NIO  "NIO" //Nicaraguan Córdoba

#define BR08_PRO_CUR_CODE_UZS  0x86
#define BR08_PRO_CUR_DESC_UZS  "UZS" //Uzbekistan Som

#define BR08_PRO_CUR_CODE_MGA  0x87
#define BR08_PRO_CUR_DESC_MGA  "MGA" //Malagasy Ariary

#define BR08_PRO_CUR_CODE_TJS  0x88
#define BR08_PRO_CUR_DESC_TJS  "TJS" //Tajikistani Somoni

#define BR08_PRO_CUR_CODE_PYG  0x89
#define BR08_PRO_CUR_DESC_PYG  "PYG" //Paraguayan Guarani

#define BR08_PRO_CUR_CODE_BND  0x8A
#define BR08_PRO_CUR_DESC_BND  "BND" //Brunei Dollar

#define BR08_PRO_CUR_CODE_VND  0x8B
#define BR08_PRO_CUR_DESC_VND  "VND" //Vietnamese Dong

#define BR08_PRO_CUR_CODE_XCD  0x8C
#define BR08_PRO_CUR_DESC_XCD  "XCD" //Eastern Caribbean Dollar

#define BR08_PRO_CUR_CODE_NGN  0x8D
#define BR08_PRO_CUR_DESC_NGN  "NGN" //Nigerian Naira

#define BR08_PRO_CUR_CODE_MZN  0x8E
#define BR08_PRO_CUR_DESC_MZN  "MZN" //Mozambican Metical

#define BR08_PRO_CUR_CODE_UGX  0x8F
#define BR08_PRO_CUR_DESC_UGX  "UGX" //Ugandan Shilling

#define BR08_PRO_CUR_CODE_KGS  0x90
#define BR08_PRO_CUR_DESC_KGS  "KGS" //Kyrgyzstani Som

#define BR08_PRO_CUR_CODE_LBP  0x91
#define BR08_PRO_CUR_DESC_LBP  "LBP" //Lebanese Pound

#define BR08_PRO_CUR_CODE_AZN  0x92
#define BR08_PRO_CUR_DESC_AZN  "AZN" //Azerbaijani Manat

#define BR08_PRO_CUR_CODE_JMD  0x93
#define BR08_PRO_CUR_DESC_JMD  "JMD" //Jamaican Dollar

#define BR08_PRO_CUR_CODE_SCR  0x94
#define BR08_PRO_CUR_DESC_SCR  "SCR" //Seychellois Rupee

#define BR08_PRO_CUR_CODE_XAF  0x95
#define BR08_PRO_CUR_DESC_XAF  "XAF" //Central African CFA Franc

#define BR08_PRO_CUR_CODE_SDG  0x96
#define BR08_PRO_CUR_DESC_SDG  "SDG" //Sudanese Pound

#define BR08_PRO_CUR_CODE_GHS  0x97
#define BR08_PRO_CUR_DESC_GHS  "GHS" //Ghanaian Cedi

#define BR08_PRO_CUR_CODE_VUV  0x98
#define BR08_PRO_CUR_DESC_VUV  "VUV" //Vanuatu Vatu

#define BR08_PRO_CUR_CODE_JOD  0x99
#define BR08_PRO_CUR_DESC_JOD  "JOD" //Jordanian Dinar

#define BR08_PRO_CUR_CODE_SYP  0x9A
#define BR08_PRO_CUR_DESC_SYP  "SYP" //Syrian Pound

#define BR08_PRO_CUR_CODE_EGP  0x9B
#define BR08_PRO_CUR_DESC_EGP  "EGP" //Egyptian Pound

#define BR08_PRO_CUR_CODE_BHD  0x9C
#define BR08_PRO_CUR_DESC_BHD  "BHD" //Bahraini Dinar

#define BR08_PRO_CUR_CODE_GYD  0x9D
#define BR08_PRO_CUR_DESC_GYD  "GYD" //Guyanese Dollar

#define BR08_PRO_CUR_CODE_BOB  0x9E
#define BR08_PRO_CUR_DESC_BOB  "BOB" //Bolivian Boliviano

#define BR08_PRO_CUR_CODE_IQD  0x9F
#define BR08_PRO_CUR_DESC_IQD  "IQD" //Iraqi Dinar

#define BR08_PRO_CUR_CODE_CDF  0xA0
#define BR08_PRO_CUR_DESC_CDF  "CDF" //Congolese Franc

#define BR08_PRO_CUR_CODE_LYD  0xA1
#define BR08_PRO_CUR_DESC_LYD  "LYD" //Libyan Dinar

#define BR08_PRO_CUR_CODE_DZD  0xA2
#define BR08_PRO_CUR_DESC_DZD  "DZD" //Algerian Dinar

#define BR08_PRO_CUR_CODE_LAK  0xA4
#define BR08_PRO_CUR_DESC_LAK  "LAK" //Lao Kip

#define BR08_PRO_CUR_CODE_WST  0xA5
#define BR08_PRO_CUR_DESC_WST  "WST" //Samoan Tala

#define BR08_PRO_CUR_CODE_XPF  0xA6
#define BR08_PRO_CUR_DESC_XPF  "XPF" //CFP Franc

#define BR08_PRO_CUR_CODE_TMT  0xA7
#define BR08_PRO_CUR_DESC_TMT  "TMT" //Turkmenistani Manat

#define BR08_PRO_CUR_CODE_CVE  0xA8
#define BR08_PRO_CUR_DESC_CVE  "CVE" //Cape Verde Escudo

#define BR08_PRO_CUR_CODE_AOA  0xA9
#define BR08_PRO_CUR_DESC_AOA  "AOA" //Angolan Kwanza

#define BR08_PRO_CUR_CODE_NPR  0xAA
#define BR08_PRO_CUR_DESC_NPR  "NPR" //Nepalese Rupee

#define BR08_PRO_CUR_CODE_RWF  0xAB
#define BR08_PRO_CUR_DESC_RWF  "RWF" //Rwandan Franc

#define BR08_PRO_CUR_CODE_KHR  0xAC
#define BR08_PRO_CUR_DESC_KHR  "KHR" //Cambodian Riel

#define BR08_PRO_CUR_CODE_FJD  0xAD
#define BR08_PRO_CUR_DESC_FJD  "FJD" //Fijian Dollar

#define BR08_PRO_CUR_CODE_MMK  0xAE
#define BR08_PRO_CUR_DESC_MMK  "MMK" //Myanmar Kyat

#define BR08_PRO_CUR_CODE_EUR  0xE0
#define BR08_PRO_CUR_DESC_EUR  "EUR" //Eurozone
/******************CUR_CODE END****************************************/

#endif /* BR08_PRO_DEV_DEF_H_ */
