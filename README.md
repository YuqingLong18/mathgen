# Solution Manual Generator - MVP

A web-based solution manual generator that converts math problem sheets (PDFs/images) into LaTeX-formatted solutions using AI models via OpenRouter API.

## Features

- 📤 Upload PDF or image files containing math problems
- ✏️ Optional custom prompts for specific instructions
- 🎚️ Three detail levels: Simple, Usual, Detailed
- 🤖 AI model integration via OpenRouter for solution generation
- 📄 LaTeX compilation to PDF
- 💾 Download both PDF and `.tex` source files

## Prerequisites

- Node.js 18+ and npm/yarn
- XeLaTeX installed on your system (for PDF compilation)
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Installing XeLaTeX

**macOS:**
```bash
brew install --cask mactex
```

**Ubuntu/Debian:**
```bash
sudo apt-get install texlive-xetex texlive-lang-chinese
```

**Windows:**
Download and install [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)

### PDF to Image Conversion (Optional)

For PDF processing, install `poppler-utils`:

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Configure environment variables:**
Edit `.env` and add your OpenRouter API key:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o  # See available models at https://openrouter.ai/models
OPENROUTER_HTTP_REFERER=http://localhost:3000  # Optional: Your app URL
OPENROUTER_X_TITLE=Solution Manual Generator  # Optional: Your app name
```

**Available Models:**
- `openai/gpt-4o` - OpenAI GPT-4o (recommended)
- `openai/gpt-4-vision-preview` - OpenAI GPT-4 Vision
- `anthropic/claude-3-opus` - Anthropic Claude 3 Opus
- `anthropic/claude-3-sonnet` - Anthropic Claude 3 Sonnet
- `google/gemini-pro-vision` - Google Gemini Pro Vision
- See [OpenRouter Models](https://openrouter.ai/models) for the full list

4. **Create necessary directories:**
```bash
mkdir -p tmp downloads
```

## Running

**Development (accessible on local network):**
```bash
npm run dev
```

The server will start on port 3088 and be accessible at:
- `http://localhost:3088` (on the host machine)
- `http://<your-ip-address>:3088` (from other devices on the same WiFi network)

**To find your IP address:**

**Quick method (macOS/Linux):**
```bash
./find-ip.sh
```

**Manual methods:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for an IP address starting with `192.168.` or `10.` or `172.` (like `192.168.1.100`)

**Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```
or
```bash
hostname -I
```

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with `192.168.` or `10.`)

**Sharing with colleagues on the same WiFi:**
1. Start the server: `npm run dev`
2. Find your IP address using one of the commands above
3. Share this URL with your colleagues: `http://<your-ip>:3088`
   - Example: If your IP is `192.168.1.100`, share `http://192.168.1.100:3088`
4. Make sure your firewall allows incoming connections on port 3088

**Firewall settings:**
- **macOS:** System Settings → Network → Firewall → Options → Allow incoming connections for Node/Next.js
- **Linux:** `sudo ufw allow 3088` (if using UFW)
- **Windows:** Windows Defender Firewall → Allow an app → Add Node.js

**Production:**
```bash
npm run build
npm start
```

The production server will also run on port 3088 and be accessible on your local network.

## Usage

1. Upload a PDF or image file containing math problems
2. (Optional) Add a custom prompt with specific instructions
3. Select the desired solution detail level
4. Click "Generate Solutions"
5. Download the generated PDF and/or LaTeX source file

## Project Structure

```
mathgen/
├── app/
│   ├── api/
│   │   ├── process/route.ts    # Main processing endpoint
│   │   └── download/route.ts   # File download endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main upload interface
│   └── globals.css             # Global styles
├── lib/
│   └── latex-sanitizer.ts      # LaTeX security sanitization
├── tmp/                        # Temporary files (gitignored)
├── downloads/                  # Generated files (gitignored)
└── package.json
```

## Security Notes

- LaTeX output is sanitized to prevent shell escape and file I/O attacks
- API keys are stored server-side only
- Upload size limit: 10MB (configurable in `next.config.js`)
- Temporary files are cleaned up after processing

## Troubleshooting

**LaTeX compilation fails:**
- Ensure XeLaTeX is installed and in your PATH
- CJK (Chinese/Japanese/Korean) fonts are automatically detected - the system will only include CJK support if needed
- If compilation fails, the `.tex` file will still be available for download so you can fix and compile manually
- Common issues:
  - Font errors: The system uses system default fonts for CJK characters. If you need specific fonts, edit the generated `.tex` file
  - Missing packages: Ensure you have `texlive-xetex` and `texlive-lang-chinese` installed (or equivalent)

**PDF conversion fails:**
- Install `poppler-utils` for PDF to image conversion
- The system will fallback to sending PDF directly to the AI model if conversion fails

**OpenRouter API errors:**
- Verify your API key is correct (get one at https://openrouter.ai/keys)
- Check your OpenRouter account balance and credits
- Ensure the model name is correct (use format like `openai/gpt-4o` or `anthropic/claude-3-opus`)
- Check the [OpenRouter status page](https://status.openrouter.ai/) for service issues
- Verify the model supports vision/image inputs if using image uploads

## License

MIT

