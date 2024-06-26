import { useState } from 'react';
import { Tabela } from './Table/Tabela';
import styles from './mainContent.module.css';
import {
  Product,
  Pack,
  ProductOrPack,
  ApiResponse } from '../../../utils/Types/ResponseType';

export function MainContent() {
  const [file, setFile] = useState<File | null>(null);

  const [mistake, setMistake] = useState<string[] | null>(null);

  const [validatedProducts,
    setValidatedProducts] = useState<ProductOrPack[] | null>(null);

  const [isValid, setIsValid] = useState<boolean | null>(null);

  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  }
  const processResponse = (response: ApiResponse) => {
    const flattenedResponse = response.flat();

    const products = flattenedResponse
      .filter((item: Product | Pack) => item
        .status === 'success' && 'product' in item && item.product.code < 999);

    const packs = flattenedResponse
      .filter((item: Product | Pack) => item
        .status === 'success' && 'pack' in item && item.pack.code > 999);

    const errors = flattenedResponse
      .filter((item: Product | Pack) => item.status === 'error');

    return { items: [...products, ...packs], errors };
  };

  async function handleValidation() {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/readcsv`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (typeof data === 'object' && 'message' in data) {
        setMistake([data.message]);
      }
      const { items, errors } = processResponse(data);
      setValidatedProducts(items);
      setMistake(errors.map((errorItem) => {
        if ('error' in errorItem) {
          return errorItem.error as string;
        }
        return `Status: ${errorItem.status}, `;
      }));
      setIsLoading(true);
      setIsValid(true);
    } catch (error) {
      console.error('Erro ao validar o arquivo:', error);
    }
  }
  async function handleUpdate() {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/updatecsv`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar os produtos');
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setMistake([]);
        setIsValid(true);

        setUpdateMessage(data.data.message);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.data.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao atualizar os produtos:', error);

      setMistake([(error as { message: string }).message]);
    }
  }
  function renderContent() {
    if (isLoading) {
      return <div className={ styles.loading }>Carregando...</div>;
    }
    if (updateMessage) {
      return <div className={ styles.message }>{updateMessage}</div>;
    }
    return <Tabela products={ validatedProducts } errors={ mistake } />;
  }

  return (
    <main className={ styles.main }>
      <div>
        <input
          type="file"
          accept=".csv"
          onChange={ handleFileChange }
          className={ styles.input }
        />
        <button
          className={ !file ? styles.buttonDisabled : styles.button }
          onClick={ handleValidation }
          disabled={ !file }
        >
          Validar Arquivo
        </button>
      </div>
      {renderContent()}
      <button
        className={ mistake?.some((miss: string) => miss)
          || !isValid ? styles.buttonDisabled : styles.button }
        disabled={ !isValid }
        onClick={ handleUpdate }
      >
        Atualizar Produtos
      </button>
    </main>
  );
}
