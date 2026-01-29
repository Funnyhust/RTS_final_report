import mammoth
from markdownify import markdownify as md
import sys
import os

def convert_docx_to_md(docx_path):
    if not os.path.exists(docx_path):
        print(f"Error: File '{docx_path}' not found.")
        return

    output_path = os.path.splitext(docx_path)[0] + ".md"
    
    print(f"Converting '{docx_path}' to HTML using mammoth...")
    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        html = result.value
        messages = result.messages
        for message in messages:
            print(f"Mammoth warning: {message}")

    print(f"Converting HTML to Markdown using markdownify...")
    # Strip unnecessary tags and clean up
    markdown = md(html, heading_style="ATX")

    with open(output_path, "w", encoding="utf-8") as md_file:
        md_file.write(markdown)
    
    print(f"Successfully converted to '{output_path}'")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        convert_docx_to_md(sys.argv[1])
    else:
        # Default for this user's request
        convert_docx_to_md("BantudanhgiaLeBaVietAn.docx")
