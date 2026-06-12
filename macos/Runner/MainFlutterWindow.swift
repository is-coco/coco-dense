import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    self.contentViewController = flutterViewController
    self.minSize = NSSize(width: 375, height: 667)

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()
    
    // Force phone-size frame after everything is loaded
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
      let windowWidth: CGFloat = 390
      let windowHeight: CGFloat = 740
      let x = screenFrame.midX - windowWidth / 2
      let y = screenFrame.midY - windowHeight / 2
      self.setFrame(NSRect(x: x, y: y, width: windowWidth, height: windowHeight), display: true, animate: false)
    }
  }
}
