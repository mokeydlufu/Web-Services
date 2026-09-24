Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.Run "cmd.exe /c """"" & scriptsDir & "\launcher-usuarios-service.bat""""", 0, False
WScript.Sleep 2500

WshShell.Run "cmd.exe /c """"" & scriptsDir & "\launcher-ofertas-service.bat""""", 0, False
WScript.Sleep 2500

WshShell.Run "cmd.exe /c """"" & scriptsDir & "\launcher-postulaciones-service.bat""""", 0, False
