
# AGENT.md — Solution Manual Generator

## 0. Overview

This project is a **web-based solution-manual generator** designed for teachers to upload question sheets (PDFs or images) and automatically obtain LaTeX-formatted solutions.
The backend integrates **GPT-5** (multimodal) for reasoning and **LaTeX rendering** for producing downloadable PDFs and `.tex` source files.

---

## 1. Core Workflow

### Step 1: User Upload & Prompt

* **Inputs:**

  * One or more **images** (JPG, PNG) or a single **PDF** file containing math problems.
  * An optional **prompt** (text description or instruction).
* **Frontend:**

  * File upload interface with drag-and-drop or “select file.”
  * Text box for custom prompt.
  * Radio or dropdown selector for solution detail level (see Step 2).
* **Backend:**

  * Validate and temporarily store uploaded files.
  * Convert multi-page PDFs into page images or base64 for GPT input.

---

### Step 2: Solution Detail Level

Users choose one of three levels:

| Level | Name         | Description                                                           |
| ----- | ------------ | --------------------------------------------------------------------- |
| a     | **Simple**   | Only numerical or short final answers.                                |
| b     | **Usual**    | Main solution steps and key equations, limited verbal explanation.    |
| c     | **Detailed** | Every logical step and explanation, full derivations, and commentary. |

Backend maps these to an internal instruction template appended to the user prompt before sending to GPT-5.

---

### Step 3: GPT-5 Request

* **Model:** `"gpt-5"` (or fallback `"gpt-4o"` if not yet available).
* **Inputs:**

  * Text prompt (user instruction + level directive).
  * Uploaded images or PDF pages passed as `input_image`.
* **Expected Output:**

  * Pure **LaTeX code**, fully compilable.
  * No Markdown or prose unless explicitly wrapped in LaTeX comments (`%`).
* **Best-practice settings:**

  ```json
  {
    "model": "gpt-5",
    "input": [
      {
        "role": "user",
        "content": [
          { "type": "input_text", "text": "<combined prompt>" },
          { "type": "input_image", "image_url": "<data-url-or-temp-path>" }
        ]
      }
    ],
    "max_output_tokens": 4000
  }
  ```
* Validate model output: ensure it starts with `\documentclass` or `\begin{document}`.

---

### Step 4: LaTeX Rendering

* **Renderer:** A backend LaTeX engine such as `pdflatex` or `xelatex`.
* **Font & Language Support:**

  * Use `xelatex` or `lualatex` to support both **Chinese and English** characters.
  * Example preamble snippet:

    ```latex
    \usepackage{xeCJK}
    \setCJKmainfont{SimSun}
    \usepackage{amsmath, amssymb}
    ```
* **Math Mode:** Ensure the engine supports standard math environments (`align`, `equation`, etc.).
* **Error Handling:** If compilation fails, capture logs and display a clear message to the user.

---

### Step 5: PDF Packaging & Download

* After successful rendering:

  * Serve the compiled **PDF** for direct download.
  * Retain a copy of the **raw `.tex` file** for user access.
  * Optionally compress both into a `.zip` bundle for convenience.

---

### Step 6: Advanced / Future Features

* **Raw LaTeX Editor:**
  Allow users who understand LaTeX to:

  * Edit or upload their `.tex` source directly.
  * Re-render using the backend LaTeX engine.
* **Batch Mode:**
  Support multiple uploaded exercises per run.
* **Session Storage:**
  Temporary retention (e.g., 24 hours) for re-render or correction.
* **Template Library:**
  Optional header/footer templates (school logo, title page, etc.).

---

## 2. Technical Stack Recommendations

| Component    | Suggested Tech                        | Notes                                                    |
| ------------ | ------------------------------------- | -------------------------------------------------------- |
| Frontend     | React / Next.js                       | Lightweight drag-and-drop, status bar, progress feedback |
| Backend      | Node.js + Express or FastAPI          | Handles file upload, GPT-5 calls, LaTeX rendering        |
| Storage      | Local tmp + S3/OSS                    | Delete temp files after rendering                        |
| LaTeX Engine | `xelatex`                             | Ensures UTF-8 + CJK support                              |
| Security     | Validate uploads, sanitize GPT output | Prevent LaTeX injection                                  |
| Deployment   | Dockerized microservice               | Scalable, stateless                                      |

---

## 3. Example Prompt Construction

```text
You are an expert math teacher. 
Read the attached problem sheet and provide solutions in pure LaTeX code.
Detail level: <simple/usual/detailed>.

Each question should be labeled clearly (e.g., Q1, Q2, ...).
Do not include explanations outside LaTeX syntax.
```

---

## 4. Example File Flow

1. **Upload:** `worksheet.pdf`
2. **Converted to images:** `page1.png`, `page2.png`
3. **GPT-5 Output:** `solutions.tex`
4. **Render:** `xelatex solutions.tex → solutions.pdf`
5. **Downloadable:**

   * `/downloads/solutions.pdf`
   * `/downloads/solutions.tex`

---

## 5. Security & Compliance

* Sanitize LaTeX output: block `\write18`, file I/O, or shell escape commands.
* Store API keys server-side only.
* Set maximum upload size (e.g., 10 MB).
* Delete temp files post-processing.

---

## 6. Future Enhancements

* Streaming progress bar for GPT responses.
* Integrated markdown/HTML preview before rendering.
* Collaboration or commenting panel for co-editing solutions.
* Role-based teacher logins and usage tracking.

---

**End of Document**
Version 1.0 — November 2025
