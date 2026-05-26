import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';

export default function BibleProvider({ children }) {
  return (
    <SQLiteProvider
      databaseName='bible.db'
      assetSource={{ assetId: require('../../assets/bible/bible.db') }}
      onInit={async (db) => {
        await db.execAsync('PRAGMA foreign_keys = ON;');
      }}
    >
      {children}
    </SQLiteProvider>
  );
}
