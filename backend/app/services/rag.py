from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import   HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import os

class RAGService:
    def __init__(self):
        #loads the embbedator to the ram (the model that will turn our text into vector)
        print("loading the embedding model...")
        self.embedding_function = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        #we save our db path in this variable to not hardcode it alter
        self.db_path = "./chroma_db"
    def process_file(self, file_path: str, session_id: str):
        #here we split the pdf into chunks of 500chars
        #create the loader
        loader = PyPDFLoader(file_path)
        #load the pdf load every pdf page in to python list [page1, page2, ...]
        documents = loader.load()
        #define our text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap = 50,
            separators=["\n\n", "\n", " ", ""]
        )
        #we start the splitting proccess
        #The AI Model (Hugging Face) cannot read a whole page at once. 
        # It has a limit (usually 512 words). By flattening everything into small chunks,
        #  we ensure the AI can digest every single sentence without choking.
        chunks = text_splitter.split_documents(documents)
        for chunk in chunks:
            chunk.metadata["session_id"] = session_id
        #we turn our chunks into vector and we store them in the vectordb croma
        Chroma.from_documents(
            #chunks get loaded into ebbedding function and turned into vectors and stored in db_path with each chunks having the user session id
            documents=chunks,
            embedding =self.embedding_function,
            persist_directory=self.db_path,
        )
    def search_resume(self, query: str, session_id: str, k=3):
        #we are opening  the  existing database above we defined it
        #The database stores numbers (vectors). To search it, you need to turn your question ("Does he know React?") into numbers too.
        #You must provide the exact same translator (embedding function) you used when saving, or the numbers won't match.
        db = Chroma( embedding_function=self.embedding_function,
            persist_directory=self.db_path)
        result = db.similarity_search(query, k=k, filter={"session_id": session_id})  
        client_text_list = []
        for doc in result:
            text_part = doc.page_content
            client_text_list.append(text_part)
        return client_text_list



