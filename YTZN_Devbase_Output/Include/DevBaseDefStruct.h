#ifndef __DEVBASEDEFSTRUCT_H__
#define __DEVBASEDEFSTRUCT_H__

#include <iostream>
using namespace std;
#include <string.h>
#include <string>
#include <stdio.h>
#include <stdlib.h>

#include "typedef.h"


#define CTSFLOW 1
#define RTSFLOW 2



#define SUCCESS					0	
#define FAIL					1	

#define ERRORFLAG_CLEAR			0	


#define CATALOG_FATAL			0	
#define	CATALOG_NORMAL			1	
#define	GATALOG_NOTE			2	


#define MSG_GENERAL				1	
#define	MSG_COMM_SEND			2	
#define	MSG_COMM_REV			3	

#define TCPIP_ADDRESS_LENGTH	50
#define USB_PIPES_LENGTH		50
#define USB_EXTENDSTR_LENGTH	256

// Parity
#define NOPARITY            0
#define ODDPARITY           1
#define EVENPARITY          2
#define MARKPARITY          3
#define SPACEPARITY         4

// Stopbit
#define ONESTOPBIT          0
#define ONE5STOPBITS        1	// no this setting in Linux, but only define here.
#define TWOSTOPBITS         2

//#define USB_DEAL

//==ODevBase==BEGIN==ERROR==DEFINE=======================================================================
#define E_DEVBASE_BASE				    	900

#define E_DEVBASE_LOGICNAME_NULL		(E_DEVBASE_BASE + 20)	// 920 
#define E_DEVBASE_OPEN_COMCFGFILE		(E_DEVBASE_BASE + 21)	// 921

#define E_DEVBASE_LOGICNAME_ERROR		(E_DEVBASE_BASE + 22)	// 922 

#define E_DEVBASE_READ_COMID			(E_DEVBASE_BASE + 30)	// 930 
#define E_DEVBASE_READ_COMMTYPE			(E_DEVBASE_BASE + 31)	// 931 
#define E_DEVBASE_READ_COMBAUD			(E_DEVBASE_BASE + 32)	// 932 
#define E_DEVBASE_READ_VID_PID			(E_DEVBASE_BASE + 33)	// 933 
#define E_DEVBASE_READ_INICFGFILE		(E_DEVBASE_BASE + 34)	// 934 
#define E_DEVBASE_ACCESS_INICFG			(E_DEVBASE_BASE + 35)	// 935
#define E_DEVBASE_READ_USB_GUID			(E_DEVBASE_BASE + 36)	// 936 

#define E_DEVBASE_INVALID_COMMTYPE		(E_DEVBASE_BASE + 50)	// 950
#define E_DEVBASE_INVALID_COM_ID		(E_DEVBASE_BASE + 51)	// 951 
#define E_DEVBASE_INVALID_PARA			(E_DEVBASE_BASE + 52)	// 952 

#define E_DEVBASE_OPEN_USB_DEVICE		(E_DEVBASE_BASE + 60)	// 960


#define E_DEVBASE_OPEN_COM				(E_DEVBASE_BASE + 70)	// 970 
#define E_DEVBASE_CLOSE_COM				(E_DEVBASE_BASE + 71)	// 971 
#define E_DEVBASE_ACCESS_COM			(E_DEVBASE_BASE + 72)	// 972 
#define E_DEVBASE_SEND_CMD				(E_DEVBASE_BASE + 73)	// 973
#define E_DEVBASE_RECV_DATA				(E_DEVBASE_BASE + 74)	// 974 
#define E_DEVBASE_CLEAR_BUF				(E_DEVBASE_BASE + 75)	// 975

#pragma pack(push, 1)
typedef enum __MIDL_IComm_0001
{
    COMM_COM = 1,
    COMM_COMBOARD = COMM_COM + 1,
    COMM_USB = COMM_COMBOARD + 1,
    COMM_TCPIP = COMM_USB + 1
}tCommType;

#ifndef GUID_DEFINED
#define GUID_DEFINED
typedef struct _GUID	// Reserved.
{
    unsigned long  Data1;
    unsigned short Data2;
    unsigned short Data3;
    unsigned char  Data4[8];
} GUID;
#endif /* GUID_DEFINED */

struct  tComInfo
{
    unsigned int iDatabits;	//
    unsigned int iStopbits;	// 
    unsigned int iParity;	//

    unsigned int iComID;	// 
    unsigned int iBaudRate;	//
    unsigned int iFlowcontrol; //

    //
    unsigned int fParity;
    unsigned int fOutxCtsFlow;
    unsigned int fOutxDsrFlow;
    unsigned int fDtrControl;
    unsigned int fDsrSensitivity;
    unsigned int fTXContinueOnXoff;
    unsigned int fOutX;
    unsigned int fInX;
    unsigned int fRtsControl;
    unsigned short XonLim;
    unsigned short XoffLim;
    char XonChar;
    char XoffChar;
    unsigned int ReadIntervalTimeout;
    unsigned int ReadTotalTimeoutMultiplier;
    unsigned int ReadTotalTimeoutConstant;
    unsigned int WriteTotalTimeoutMultiplier;
    unsigned int WriteTotalTimeoutConstant;
};
struct  tComBoardInfo
{
    int iBand;
    int iDataLen;
    int iEventFlag;
    int iStopFlag;
    int iComPort;
    struct tComInfo sComInfo;
};
struct  tUSBInfo
{
    int iReserver1;
    int iReserver2;
    int iReserver3;
    int iReserver4;
};
struct  tTCPIPInfo
{
    unsigned char ipAddress[TCPIP_ADDRESS_LENGTH];
    int iSendPort;
    int iReceivePort;
    int iLinkMode;
};
typedef union _UCommInfo
{
    struct tComInfo sComInfo;
    struct tComBoardInfo sComBoardInfo;
    struct tUSBInfo sUSBInfo;
    struct tTCPIPInfo sTCPIPInfo;
    /* Empty union arm */
}	tCommInfo;

struct  tCommCfg
{
    tCommType eCommType;
    tCommInfo unCommInfo;
    //  char __RPC_FAR *pcExtern;
};
struct  tUSBInfo2
{
    GUID sGuid;
    char acSendPipes[USB_PIPES_LENGTH];
    char acRecvPipes[USB_PIPES_LENGTH];
    char acExtendStr[USB_EXTENDSTR_LENGTH];
    int iReserve;
};
typedef union _UCommInfo2
{
    struct tComInfo sComInfo;
    struct tComBoardInfo sComBoardInfo;
    struct tUSBInfo2 sUSBInfo;
    struct tTCPIPInfo sTCPIPInfo;
    /* Empty union arm */
}	tCommInfo2;

struct  tCommCfg2
{
    tCommType eCommType;
    tCommInfo2 unCommInfo;
    //  char __RPC_FAR *pcExtern;
};

struct tGrgIniCfgInfo
{
    int		iCommType;	
    int		iComID;		
    int		iComBaud;	

    char	acSendPipes[USB_PIPES_LENGTH];		
    char	acRecvPipes[USB_PIPES_LENGTH];
    char	acIniCfgFileName[32];	//
    char	acDevCommLogID[32];		//
    char	acExtendStr[32];		//
    int		aiReserved[32];			//
    GUID    stGuid[1];
};

typedef struct
{
    int		iLogicCode;			// 
    int		iPhyCode;			//
    int		iHandle;			//
    int		iType;				// 

    char	acDevReturn[128];
    char	acReserve[128];
} tDevReturn;
#pragma pack(pop)

#endif // __DEVBASEDEFSTRUCT_H__


