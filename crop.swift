import Foundation
import AppKit

let inputPath = "/Users/basakhicret/.gemini/antigravity/scratch/searya-app/public/searya-logo.png"
let outputPath = "/Users/basakhicret/.gemini/antigravity/scratch/searya-app/public/searya-bag-icon.png"

if let image = NSImage(contentsOfFile: inputPath) {
    let w = image.size.width
    let h = image.size.height
    // Crop left bag icon (left 38% width)
    let cropRect = NSRect(x: 0, y: 0, width: w * 0.38, height: h)
    
    let newImage = NSImage(size: cropRect.size)
    newImage.lockFocus()
    image.draw(in: NSRect(origin: .zero, size: cropRect.size), from: cropRect, operation: .copy, fraction: 1.0)
    newImage.unlockFocus()
    
    if let tiffData = newImage.tiffRepresentation,
       let bitmapImage = NSBitmapImageRep(data: tiffData),
       let pngData = bitmapImage.representation(using: .png, properties: [:]) {
        try? pngData.write(to: URL(fileURLWithPath: outputPath))
        print("SUCCESS: Bag icon cropped successfully!")
    }
}
