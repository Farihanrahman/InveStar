#!/usr/bin/env python3
import subprocess
import sys
import os

def generate_pdf():
    # Read the markdown file
    with open('InveStar_Stellar_Wallet_KYC.pdf.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create HTML with proper styling
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>InveStar Soroban-Integrated Stellar Wallet & KYC</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }}
        h1, h2, h3 {{
            color: #2c3e50;
        }}
        h1 {{
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 5px;
        }}
        code {{
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .mermaid {{
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
{content}
</body>
</html>
"""
    
    # Write HTML file
    with open('temp.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("HTML file created. You can open temp.html in your browser and print to PDF.")
    print("Or use your browser's 'Print to PDF' feature.")
    
    # Try to open in default browser
    try:
        subprocess.run(['open', 'temp.html'])
        print("Opened in browser. Please use 'Print to PDF' to save as PDF.")
    except:
        print("Please open temp.html in your browser manually.")

if __name__ == "__main__":
    generate_pdf() 