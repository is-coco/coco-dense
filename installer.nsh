!macro customInit
  !define MUI_ABORTWARNING

  !define MUI_WELCOMEPAGE_TITLE "Welcome to Coco Dense"
  !define MUI_WELCOMEPAGE_TEXT "Coco Dense is a local encrypted password manager.$\r$\n$\r$\nAll your passwords are protected with AES-256-GCM encryption.$\r$\n$\r$\nClick Next to begin installation."

  !define MUI_FINISHPAGE_RUN "$INSTDIR\Coco Dense.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch Coco Dense"
  !define MUI_FINISHPAGE_LINK "Visit GitHub Repository"
  !define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/is-coco/coco-dense"
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInstall
  StrCpy $0 "$INSTDIR"
  StrCpy $1 $0 "" -1
  StrCmp $1 "\" +2
  StrCpy $0 "$0"
  StrLen $2 "Coco Dense"
  StrCpy $3 $0 "" -$2
  StrCmp $3 "Coco Dense" +3
  StrCpy $INSTDIR "$0\Coco Dense"
  Goto +2
  ; already correct
  Nop
!macroend
