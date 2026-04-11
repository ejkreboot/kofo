/// <reference types="astro/client" />

interface AlbumLocals {
  albumId: string;
  bucketId: string;
  albumName: string;
  exp: number;
}

declare namespace App {
  interface Locals {
    album?: AlbumLocals;
  }
}
