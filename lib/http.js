import { NextResponse } from 'next/server';
import { DiscoverError } from './discover.js';

const NO_STORE = { 'Cache-Control': 'no-store' };

export function ok(body) {
  return NextResponse.json(body, { headers: NO_STORE });
}

export function fail(err) {
  if (err instanceof DiscoverError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status, headers: NO_STORE }
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: 'Something went wrong', code: 'INTERNAL' },
    { status: 500, headers: NO_STORE }
  );
}
