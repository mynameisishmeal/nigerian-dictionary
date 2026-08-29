import algoliasearch from 'algoliasearch';

// We need the admin key to push records from our backend
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const adminKey = process.env.ALGOLIA_ADMIN_KEY || '';

// Backend client for writing data
// @ts-ignore - The Algoliasearch v5 API changed slightly, we'll initialize defensively
export const algoliaBackendClient = appId && adminKey ? algoliasearch(appId, adminKey) : null;

export const algoliaIndexName = 'nigerian_dictionary_words';

export interface AlgoliaWordRecord {
  id: string;
  normalizedTerm: string;
  displayTerm: string;
  aliases?: string[];
  meaning: string;
  example?: string | null;
  languageFamily?: string | null;
  netScore?: number;
}

export async function syncWordToAlgolia(wordRecord: AlgoliaWordRecord) {
  if (!algoliaBackendClient) {
    console.warn("Algolia is not configured. Skipping sync.");
    return;
  }
  
  try {
    // We format the record for Algolia. We use the Prisma ID as the objectID.
    const record = {
      objectID: wordRecord.id,
      normalizedTerm: wordRecord.normalizedTerm,
      displayTerm: wordRecord.displayTerm,
      aliases: wordRecord.aliases || [],
      meaning: wordRecord.meaning,
      example: wordRecord.example || null,
      languageFamily: wordRecord.languageFamily || null,
      netScore: wordRecord.netScore || 0,
    };

    const index = algoliaBackendClient.initIndex(algoliaIndexName);
    await index.saveObject(record);
    console.log(`Synced word ${record.displayTerm} to Algolia.`);
  } catch (error) {
    console.error("Failed to sync word to Algolia:", error);
  }
}

