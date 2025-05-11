import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var selectedLanguage: Language = .english
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Language Picker
                Picker("Language", selection: $selectedLanguage) {
                    ForEach(Language.allCases, id: \.self) { language in
                        Text(language.displayName).tag(language)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                // Main Buttons
                VStack(spacing: 15) {
                    NavigationLink(destination: EnhanceProductView()) {
                        HStack {
                            Image(systemName: "wand.and.stars")
                            Text(NSLocalizedString("enhance.product", comment: ""))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    NavigationLink(destination: PastProductsView()) {
                        HStack {
                            Image(systemName: "clock.arrow.circlepath")
                            Text(NSLocalizedString("past.products", comment: ""))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                }
                .padding()
                
                Spacer()
            }
            .navigationTitle(NSLocalizedString("app.title", comment: ""))
        }
        .environment(\.locale, selectedLanguage.locale)
    }
}

enum Language: String, CaseIterable {
    case english = "en"
    case turkish = "tr"
    
    var displayName: String {
        switch self {
        case .english: return "English"
        case .turkish: return "Türkçe"
        }
    }
    
    var locale: Locale {
        Locale(identifier: rawValue)
    }
}

struct EnhanceProductView: View {
    @State private var selectedImage: UIImage?
    @State private var isImagePickerPresented = false
    @State private var isEnhancing = false
    @State private var enhancedImage: UIImage?
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Image Selection
                if let selectedImage = selectedImage {
                    Image(uiImage: selectedImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 300)
                        .cornerRadius(10)
                } else {
                    Button(action: { isImagePickerPresented = true }) {
        VStack {
                            Image(systemName: "photo")
                                .font(.system(size: 40))
                            Text(NSLocalizedString("select.image", comment: ""))
                                .padding(.top, 8)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(10)
                    }
                }
                
                // Action Buttons
                VStack(spacing: 15) {
                    if selectedImage != nil {
                        Button(action: enhanceImage) {
                            HStack {
                                if isEnhancing {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "wand.and.stars")
                                }
                                Text(isEnhancing ? NSLocalizedString("enhancing", comment: "") : NSLocalizedString("enhance.image", comment: ""))
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isEnhancing ? Color.gray : Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(isEnhancing)
                        
                        Button(action: { selectedImage = nil; enhancedImage = nil }) {
                            Text(NSLocalizedString("clear.image", comment: ""))
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                }
                
                // Enhanced Image
                if let enhancedImage = enhancedImage {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(NSLocalizedString("enhanced.result", comment: ""))
                            .font(.headline)
                        
                        Image(uiImage: enhancedImage)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 300)
                            .cornerRadius(10)
                    }
                }
            }
            .padding()
        }
        .navigationTitle(NSLocalizedString("enhance.product", comment: ""))
        .sheet(isPresented: $isImagePickerPresented) {
            ImagePicker(image: $selectedImage)
        }
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func enhanceImage() {
        guard let image = selectedImage else { return }
        
        isEnhancing = true
        
        // Convert image to data
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            showError(message: NSLocalizedString("error.image.conversion", comment: ""))
            return
        }
        
        // Create URL request
        guard let url = URL(string: "https://shotiva-backend.onrender.com/api/image/enhance") else {
            showError(message: NSLocalizedString("error.invalid.url", comment: ""))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add image data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        // Send request
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isEnhancing = false
                
                if let error = error {
                    showError(message: error.localizedDescription)
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    showError(message: NSLocalizedString("error.invalid.response", comment: ""))
                    return
                }
                
                guard httpResponse.statusCode == 200 else {
                    showError(message: NSLocalizedString("error.server", comment: ""))
                    return
                }
                
                guard let data = data else {
                    showError(message: NSLocalizedString("error.no.data", comment: ""))
                    return
                }
                
                do {
                    let result = try JSONDecoder().decode(EnhanceResponse.self, from: data)
                    if let url = URL(string: result.enhancedImageUrl),
                       let data = try? Data(contentsOf: url),
                       let image = UIImage(data: data) {
                        enhancedImage = image
                    } else {
                        showError(message: NSLocalizedString("error.image.loading", comment: ""))
                    }
                } catch {
                    showError(message: NSLocalizedString("error.decoding", comment: ""))
                }
            }
        }.resume()
    }
    
    private func showError(message: String) {
        errorMessage = message
        showError = true
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.presentationMode.wrappedValue.dismiss()
            
            guard let provider = results.first?.itemProvider else { return }
            
            if provider.canLoadObject(ofClass: UIImage.self) {
                provider.loadObject(ofClass: UIImage.self) { image, _ in
                    DispatchQueue.main.async {
                        self.parent.image = image as? UIImage
                    }
                }
            }
        }
    }
}

struct EnhanceResponse: Codable {
    let success: Bool
    let enhancedImageUrl: String
}

struct PastProductsView: View {
    var body: some View {
        Text(NSLocalizedString("past.products.view", comment: ""))
            .navigationTitle(NSLocalizedString("past.products", comment: ""))
    }
}

#Preview {
    ContentView()
}

