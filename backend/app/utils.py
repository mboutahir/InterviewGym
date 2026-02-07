
import io
from pypdf import PdfReader

def extract_pdf_toString(file: bytes) ->str:

    try:
        pdf_stream = io.BytesIO(file)
        pdf_reader = PdfReader(pdf_stream)
        full_text = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)
        return '\n'.join(full_text)
    #f in printf stands for Don't just print this text. Look for curly braces {} and replace them with the actual values
    except Exception as e:
        print(f"Error while reading pdf: {e}")
        return ""

        


    