// import { SignatureV4 } from '@smithy/signature-v4';
// import { HttpRequest } from '@smithy/protocol-http';
// import { Sha256 } from '@aws-crypto/sha256-js';
// import { defaultProvider } from '@aws-sdk/credential-provider-node';
// import { v4 as uuidv4 } from 'uuid';

// /**
//  * 通常の一括応答を取得するメソッド
//  * Bedrock Agent Runtime が返すストリーミングをまとめて読み、
//  * `finalResponse.text` を返す。
//  */
// export async function invokeBedrockViaSignedFetch({
//   endpoint,
//   agentId,
//   aliasId,
//   region,
//   inputText,
// }: {
//   endpoint: string;
//   agentId: string;
//   aliasId: string;
//   region: string;
//   inputText: string;
// }) {
//   // 一意のセッションIDを付与
//   const sessionId = `chat-${uuidv4().slice(0, 8)}`;
//   // /text エンドポイントを使用（ストリーミング応答が返る）
//   const path = `/agents/${agentId}/agentAliases/${aliasId}/sessions/${sessionId}/text`;
//   const hostname = endpoint.replace(/^https?:\/\//, '');

//   // AWS SigV4 署名準備
//   const signer = new SignatureV4({
//     service: 'bedrock-agent', // 署名時に使用
//     region,
//     credentials: defaultProvider(),
//     sha256: Sha256,
//   });

//   // 署名前のリクエスト
//   const request = new HttpRequest({
//     method: 'POST',
//     protocol: 'https:',
//     hostname,
//     path,
//     headers: {
//       host: hostname,
//       'content-type': 'application/json',
//     },
//     body: JSON.stringify({
//       inputText,
//       enableTrace: true,
//     }),
//   });

//   // 署名を付与
//   const signedRequest = await signer.sign(request);

//   // 実際にfetch呼び出し
//   const response = await fetch(`https://${hostname}${path}`, {
//     method: signedRequest.method,
//     headers: signedRequest.headers as Record<string, string>,
//     body: signedRequest.body,
//   });

//   // レスポンスが正常かチェック
//   if (!response.ok || !response.body) {
//     throw new Error(`Request failed: ${response.status}`);
//   }

//   // ストリームを読み取りながら最終応答を抽出
//   const reader = response.body.getReader();
//   const decoder = new TextDecoder('utf-8');
//   let buffer = '';

//   while (true) {
//     const { done, value } = await reader.read();
//     if (done) break;
//     buffer += decoder.decode(value, { stream: true });

//     // `:message-typeevent` を区切りに分割
//     const chunks = buffer.split(':message-typeevent');
//     // 最後に残った一部は次のループで処理
//     buffer = chunks.pop() || '';

//     for (const rawChunk of chunks) {
//       const trimmed = rawChunk.trim();
//       const start = trimmed.indexOf('{');
//       const end = trimmed.lastIndexOf('}');
//       // JSON構造らしき部分を切り出す
//       if (start === -1 || end === -1 || end <= start) continue;

//       try {
//         const jsonStr = trimmed.slice(start, end + 1);
//         const parsed = JSON.parse(jsonStr);
//         // finalResponse.textを優先して取得
//         const text = parsed?.trace?.orchestrationTrace?.observation?.finalResponse?.text;
//         if (text) {
//           return {
//             output: {
//               text,
//             },
//           };
//         }

//         // もし`bytes`対応が必要ならここでbase64デコードをfallbackに
//         // const bytes = parsed?.bytes;
//         // if (bytes) {
//         //   const decoded = Buffer.from(bytes, 'base64').toString('utf-8');
//         //   return {
//         //     output: {
//         //       text: decoded,
//         //     },
//         //   };
//         // }
//       } catch (e) {
//         // JSON parse失敗。次のチャンクへ
//         console.warn('Failed to parse JSON chunk:', e);
//       }
//     }
//   }

//   // 最終的に取れなければエラー
//   throw new Error('finalResponse.text not found');
// }

