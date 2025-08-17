
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getAllTransactions } from '../data/backend';
import { Transaction } from '../types';

/**
 * Generates a CSV string from transactions.
 */
function transactionsToCSV(transactions: Transaction[]): string {
  const header = ['id', 'type', 'amount', 'currency', 'category', 'date', 'note'].join(',');
  const rows = transactions.map(t => {
    const safeNote = (t.note || '').replace(/"/g, '""');
    return [
      `"${t.id}"`,
      `"${t.type}"`,
      t.amount,
      `"${t.currency}"`,
      `"${t.category || ''}"`,
      `"${t.date}"`,
      `"${safeNote}"`,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * Export transactions to CSV.
 * Web: triggers a download using a blob.
 * Native: shows an alert explaining CSV export is supported on web in this build.
 */
export async function exportCSV(): Promise<void> {
  try {
    const transactions = await getAllTransactions();
    const csv = transactionsToCSV(transactions);

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `transactions_${date}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export CSV', 'CSV export is currently supported on web only in this build.');
    }
  } catch (e) {
    console.log('exportCSV error', e);
    Alert.alert('Error', 'Failed to export CSV.');
  }
}

/**
 * Export transactions to a PDF using expo-print, then share using expo-sharing.
 */
export async function exportPDF(): Promise<void> {
  try {
    const transactions = await getAllTransactions();
    const rows = transactions
      .map(
        t => `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${t.id}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${t.type}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${t.amount.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${t.currency}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${t.category || ''}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${new Date(t.date).toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${(t.note || '').replace(/</g, '&lt;')}</td>
        </tr>`
      )
      .join('');

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 16px; }
            h1 { font-size: 20px; }
            table { border-collapse: collapse; width: 100%; }
            thead th { background:#f9fafb; border:1px solid #e5e7eb; padding:8px; text-align:left; }
          </style>
        </head>
        <body>
          <h1>Transactions</h1>
          <table>
            <thead>
              <tr>
                <th>Id</th><th>Type</th><th>Amount</th><th>Currency</th><th>Category</th><th>Date</th><th>Note</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    if (Platform.OS === 'web') {
      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
      } else {
        Alert.alert('Export PDF', 'Please allow popups to print the PDF.');
      }
      return;
    }

    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
    } else {
      Alert.alert('Export PDF', 'Sharing is not available on this device.');
    }
  } catch (e) {
    console.log('exportPDF error', e);
    Alert.alert('Error', 'Failed to export PDF.');
  }
}
