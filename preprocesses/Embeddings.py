import json
import os
import pickle

import numpy as np
import pandas as pd
from openai import OpenAI
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler


class Embeddings:
    def __init__(self, file_path, source_key='Product ID'):
        self.client = OpenAI(api_key=os.getenv("OPENAI_KEY"))
        self.file_path = file_path
        self.products_df = None
        self.source_key = source_key # TODO validate exists on dataset

        if os.path.exists(self.file_path) is False:
            raise ValueError("Missing file: " + self.file_path)
        elif self.file_path.endswith('.json'):
            with open(self.file_path, 'r') as f:
                data = json.load(f)
            self.products_df = pd.DataFrame(data)
            self._create_and_save_embeddings()
        elif self.file_path.endswith('.csv'):
            self.products_df = pd.read_csv(self.file_path)
            self._create_and_save_embeddings()
        elif self.file_path.endswith('.pkl'):
            self._load_embeddings()
        else:
            raise ValueError("Unsupported file type. Please provide a .csv or .pkl file.")

    def _get_embedding(self, text, model="text-embedding-3-small"):
        try:
            if text is None:
                return None
            elif not text or pd.isna(text):
                return None
            if type(text) is str:
                text = text.replace("\n", " ")
            print(f'creating openai embedding for {text}')
            response = self.client.embeddings.create(input=[text], model=model)
            return response.data[0].embedding
        except Exception as e:
            print(f'Embedding failed: {text}', e)
            return None

    def _create_and_save_embeddings(self):
        print("Creating embeddings...")
        column = None
        try:
            for column in self.products_df.columns:
                if column != self.source_key:
                    print(f"applying embed {column}")
                    self.products_df[column + '_embedding'] = self.products_df[column].apply(self._get_embedding)
        except Exception as e:
            print(f'Embedding column failed: {column}', e)

        base, _ = os.path.splitext(self.file_path)
        embeddings_file = base + '.pkl'
        with open(embeddings_file, 'wb') as f:
            pickle.dump(self.products_df, f)
        print("Embeddings created and saved.")

    def get_header_byindex(self, index):
        df = pd.read_csv(self.file_path, nrows=0)  # Read only the header row
        headers = df.columns.tolist()
        if index < 0 or index >= len(headers):
            raise IndexError("Index out of range")
        return headers[index]

    def _load_embeddings(self):
        print("Loading embeddings from file...")
        with open(self.file_path, 'rb') as f:
            self.products_df = pickle.load(f)
        print("Embeddings loaded.")

    def find_recommendations_noopenai(self, user_answers, top_n=5):
        user_answers_scaled = StandardScaler().fit_transform(
            [user_answers])  # Assuming user_answers is a list of feature values
        pca = PCA(n_components=10)  # Should match the components used during embedding creation
        user_embedding = pca.fit_transform(user_answers_scaled)

        embedding_columns = [col for col in self.products_df.columns if col.endswith('_embedding')]
        product_embeddings = np.array([np.hstack(row) for row in self.products_df[embedding_columns].dropna().values])

        similarities = cosine_similarity(user_embedding, product_embeddings)
        top_indices = np.argsort(similarities[0])[::-1][:top_n]

        recommended_products = self.products_df.iloc[top_indices]
        return recommended_products[[self.source_key, 'product_name']]

    def find_recommendations(self, survey, top_n=5, model="text-embedding-3-small"):
        # Create a combined embedding for the user's survey answers
        user_embedding_parts = []
        for column in self.products_df.columns:
            if column != self.source_key and not column.endswith('_embedding'):
                user_embedding_parts.append(self._get_embedding(survey, model))

        user_embedding = np.hstack(user_embedding_parts)

        try:
            # Combine all embeddings into a single array, keeping the original indices
            embedding_columns = [col for col in self.products_df.columns if col.endswith('_embedding')]
            valid_embeddings_df = self.products_df[embedding_columns].dropna()
            product_embeddings = np.array([np.hstack(row) for row in valid_embeddings_df.values])

            similarities = cosine_similarity([user_embedding], product_embeddings)
            top_indices = np.argsort(similarities[0])[::-1][:top_n]

            recommended_products = self.products_df.iloc[valid_embeddings_df.index[top_indices]]

            title_key = self.get_header_byindex(1) # Assumes 0 is id

            recommendations = recommended_products[[self.source_key, title_key]].to_dict(orient='records')
            return recommendations
        except Exception as e:
            print(f'Recs failed: {survey}', e)
            return None

