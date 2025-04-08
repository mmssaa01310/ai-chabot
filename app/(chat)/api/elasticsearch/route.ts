import { NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';
import https from 'https';
import fs from 'fs';
import path from 'path';

type AggBuckets = { key: string; doc_count: number };

type AggregationResponse = {
  departments: { buckets: AggBuckets[] };
  groups: { buckets: AggBuckets[] };
  lines: { buckets: AggBuckets[] };
  machines: { buckets: AggBuckets[] };
  troubles: { buckets: AggBuckets[] };
};

const caCertPath = process.env.ELASTIC_CA_CERT_PATH;
const caCert = caCertPath ? fs.readFileSync(path.resolve(caCertPath)) : undefined;

const es = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER || '',
    password: process.env.ELASTIC_PASS || '',
  },
  tls: {
    ca: caCert,
    rejectUnauthorized: true,
  },
  agent: () =>
    new https.Agent({
      ca: caCert,
      rejectUnauthorized: true,
    }),
});

const index = process.env.ELASTIC_INDEX!;

export async function GET() {
  try {
    // 型付きで search を行う
    const [departmentsRes, groupsRes, linesRes, machinesRes, troublesRes] =
      await Promise.all([
        es.search<unknown, Pick<AggregationResponse, 'departments'>>({
          index,
          size: 0,
          aggs: { departments: { terms: { field: 'department.keyword', size: 100 } } },
        }),
        es.search<unknown, Pick<AggregationResponse, 'groups'>>({
          index,
          size: 0,
          aggs: { groups: { terms: { field: 'group.keyword', size: 100 } } },
        }),
        es.search<unknown, Pick<AggregationResponse, 'lines'>>({
          index,
          size: 0,
          aggs: { lines: { terms: { field: 'line.keyword', size: 100 } } },
        }),
        es.search<unknown, Pick<AggregationResponse, 'machines'>>({
          index,
          size: 0,
          aggs: { machines: { terms: { field: 'machine.keyword', size: 100 } } },
        }),
        es.search<unknown, Pick<AggregationResponse, 'troubles'>>({
          index,
          size: 0,
          aggs: { troubles: { terms: { field: 'trouble.keyword', size: 100 } } },
        }),
      ]);

    return NextResponse.json({
      departments: departmentsRes.aggregations?.departments.buckets.map((b) => b.key),
      groups: groupsRes.aggregations?.groups.buckets.map((b) => b.key),
      lines: linesRes.aggregations?.lines.buckets.map((b) => b.key),
      machines: machinesRes.aggregations?.machines.buckets.map((b) => b.key),
      troubles: troublesRes.aggregations?.troubles.buckets.map((b) => b.key),
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Elasticsearch' },
      { status: 500 }
    );
  }
}
