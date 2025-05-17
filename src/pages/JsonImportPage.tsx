import React from 'react';
import Layout from '../components/Layout';
import JsonImporter from '../components/JsonImporter';

interface JsonImportPageProps {
  // Props can be added here if needed
}

const JsonImportPage: React.FC<JsonImportPageProps> = () => {
  return (
    <Layout>
      <JsonImporter />
    </Layout>
  );
};

export default JsonImportPage;