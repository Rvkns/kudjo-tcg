import { NextResponse } from 'next/server';
import { RichiestaSchema, PropostaVenditaSchema } from '@/lib/schema/richieste';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Determine if it's a card proposal or general contact inquiry
    const isProposal = 'gioco' in body && 'descrizione_carta' in body;

    if (isProposal) {
      // Validate with PropostaVenditaSchema
      const parsed = PropostaVenditaSchema.parse(body);
      console.log('\n--- NEW CARD SALE PROPOSAL RECEIVED ---');
      console.log('Name:', parsed.nome);
      console.log('Contact info:', parsed.contatto);
      console.log('Game:', parsed.gioco);
      console.log('Card details:', parsed.descrizione_carta);
      console.log('Notes/Message:', parsed.messaggio);
      console.log('Photo Uploaded:', parsed.foto ? `Yes (${parsed.foto.substring(0, 30)}... size: ${Math.round(parsed.foto.length * 0.75 / 1024)} KB)` : 'No');
      console.log('Timestamp:', parsed.timestamp);
      console.log('----------------------------------------\n');
    } else {
      // Validate with RichiestaSchema
      const parsed = RichiestaSchema.parse(body);
      console.log('\n--- NEW ITEM INQUIRY RECEIVED ---');
      console.log('Name:', parsed.nome);
      console.log('Contact info:', parsed.contatto);
      console.log('Message:', parsed.messaggio);
      console.log('Referenced Item ID:', parsed.item_riferimento || 'None (General contact)');
      console.log('Timestamp:', parsed.timestamp);
      console.log('---------------------------------\n');
    }

    // Success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API Validation Error:', error);
    return NextResponse.json(
      { error: 'Invalid payload format', details: error },
      { status: 400 }
    );
  }
}
