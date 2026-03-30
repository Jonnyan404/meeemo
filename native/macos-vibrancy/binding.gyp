{
  "targets": [{
    "target_name": "macos_vibrancy",
    "sources": ["src/vibrancy.mm"],
    "conditions": [
      ["OS=='mac'", {
        "xcode_settings": {
          "OTHER_CPLUSPLUSFLAGS": ["-std=c++17", "-ObjC++"],
          "OTHER_LDFLAGS": ["-framework AppKit"],
          "MACOSX_DEPLOYMENT_TARGET": "10.14",
          "CLANG_ENABLE_OBJC_ARC": "YES"
        }
      }]
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")"
    ],
    "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
  }]
}
