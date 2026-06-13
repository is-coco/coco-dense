import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    self.contentViewController = flutterViewController
    self.setContentSize(NSSize(width: 390, height: 740))
    self.minSize = NSSize(width: 375, height: 667)
    RegisterGeneratedPlugins(registry: flutterViewController)
    super.awakeFromNib()
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
      let x = screenFrame.midX - 195
      let y = screenFrame.midY - 370
      self.setFrame(NSRect(x: x, y: y, width: 390, height: 740), display: true, animate: false)
    }
  }
}
