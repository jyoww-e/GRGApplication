#ifndef GRG_LOCKER_H
#define GRG_LOCKER_H

/*
* 功能说明：该源码为仿windows event事件
*
*/

#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#ifdef WIN32
#include <windows.h>
class CTraceCLocker
{
public:
	CTraceCLocker()
	{
		InitializeCriticalSection(&g_cs);
	}
	
	~CTraceCLocker()
	{
		DeleteCriticalSection(&g_cs);
	}
	
	void Lock()
	{
		EnterCriticalSection(&g_cs);
	}
	
	void UnLock()
	{
		LeaveCriticalSection(&g_cs);
	}
private:
	CRITICAL_SECTION	g_cs;
};
#else
#include <pthread.h> 
class CTraceCLocker
{
public:
	CTraceCLocker()
	{
		pthread_mutex_init(&m_pMutex, NULL);
	}
	~CTraceCLocker()
	{
		pthread_mutex_destroy(&m_pMutex);
	}
	
	void Lock()
	{
		pthread_mutex_lock(&m_pMutex);
	}
	
	void UnLock()
	{
		pthread_mutex_unlock(&m_pMutex);	
	}
private:
	pthread_mutex_t m_pMutex;
};
#endif

#endif //GRG_LOCKER
