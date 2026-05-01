import fs from "fs"
import path from "path"

describe("Environment Configuration Tests", () => {
  it(".env.example should contain only placeholder values", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example")
    const envExampleContent = fs.readFileSync(envExamplePath, "utf-8")
    
    // Check for actual secret patterns (not just variable names)
    const secretPatterns = [
      /ghp_[a-zA-Z0-9]{36}/, // GitHub PAT
      /hf_[a-zA-Z0-9]{34}/, // Hugging Face token
      /sk-[a-zA-Z0-9]{48}/, // Stripe key
      /gsk_[a-zA-Z0-9]{40}/, // Groq key
      /vcp_[a-zA-Z0-9]{32}/, // Vercel token
      /nfp_[a-zA-Z0-9]{30}/, // Netlify key
      /rnd_[a-zA-Z0-9]{32}/, // Render key
      /rlwy_[a-zA-Z0-9]{32}/, // Railway key
      /0x[a-fA-F0-9]{40}/, // Ethereum address
    ]
    
    for (const pattern of secretPatterns) {
      const match = envExampleContent.match(pattern)
      expect(match).toBeNull()
    }
  })
  
  it(".env.example should use placeholder format", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example")
    const envExampleContent = fs.readFileSync(envExamplePath, "utf-8")
    
    const lines = envExampleContent.split("\n")
    const keyValueLines = lines.filter(line => line.includes("=") && !line.startsWith("#"))
    
    for (const line of keyValueLines) {
      const value = line.split("=")[1]
      // Values should be placeholders or empty
      if (value && value !== "") {
        expect(value.startsWith("your-")).toBe(true)
      }
    }
  })
})
