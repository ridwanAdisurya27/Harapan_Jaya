import { NextRequest, NextResponse } from "next/server";
import CephClient from "@/lib/ceph-client"; // Sesuaikan path

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    // Jika action=upload, upload string "saya ganteng" ke Ceph
    if (action === "upload") {
      const content = "saya ganteng";
      const buffer = Buffer.from(content, "utf-8");

      // Generate filename dengan timestamp
      const timestamp = Date.now();
      const fileName = `ganteng-${timestamp}.txt`;

      // Upload ke Ceph
      const fileUrl = await CephClient.uploadObject(
        fileName,
        buffer,
        "text/plain"
      );

      // Redirect ke halaman untuk melihat file
      return NextResponse.redirect(
        new URL(`/api/ceph-test?filename=${fileName}`, request.url)
      );
    }

    // Jika ada parameter filename, ambil file dari Ceph
    const fileName = searchParams.get("filename");

    if (fileName) {
      // Get file dari Ceph
      const fileBuffer = await CephClient.getObject(fileName);
      const fileContent = fileBuffer.toString("utf-8");

      // Return sebagai HTML agar bisa dibaca di browser
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Ceph Test - ${fileName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .container { max-width: 800px; margin: 0 auto; }
              .content { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info { color: #666; font-size: 14px; }
              .nav { margin-top: 20px; }
              a { color: #0070f3; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🪣 File dari Ceph S3</h1>
              <div class="info">
                <p><strong>Nama file:</strong> ${fileName}</p>
                <p><strong>Ukuran:</strong> ${fileBuffer.length} bytes</p>
                <p><strong>URL:</strong> ${
                  process.env.CEPH_ENDPOINT || "https://is3.cloudhost.id"
                }/${process.env.CEPH_BUCKET || "resapling"}/${fileName}</p>
              </div>
              <div class="content">
                <h2>Isi File:</h2>
                <pre>${fileContent}</pre>
              </div>
              <div class="nav">
                <a href="/api/ceph-test?action=upload">📤 Upload lagi "saya ganteng"</a> | 
                <a href="/api/ceph-test">🏠 Kembali ke halaman utama</a>
              </div>
            </div>
          </body>
        </html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Halaman utama - jika tidak ada parameter
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Ceph Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; text-align: center; }
            h1 { color: #333; }
            .btn { 
              display: inline-block; 
              background: #0070f3; 
              color: white; 
              padding: 12px 24px; 
              border-radius: 6px; 
              text-decoration: none; 
              font-weight: bold; 
              margin: 10px;
            }
            .btn:hover { background: #0051cc; }
            .example { 
              background: #f0f8ff; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0; 
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🪣 Ceph S3 Storage Test</h1>
            <p>Test upload dan retrieve file dari Ceph S3 Object Storage</p>
            
            <div class="example">
              <h3>📝 String yang akan diupload:</h3>
              <pre>"saya ganteng"</pre>
            </div>
            
            <p>
              <a class="btn" href="/api/ceph-test?action=upload">
                📤 Upload "saya ganteng" ke Ceph
              </a>
            </p>
            
            <p><small>Setelah upload, kamu akan diarahkan ke halaman untuk melihat file</small></p>
            
            <h3>📁 File yang sudah ada:</h3>
            <p><em>Belum ada file. Upload dulu untuk melihat daftar.</em></p>
          </div>
        </body>
      </html>`,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error: any) {
    console.error("Ceph error:", error);

    // Return error sebagai HTML
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Error - Ceph Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .error { background: #ffe6e6; padding: 20px; border-radius: 8px; color: #cc0000; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error</h1>
            <div class="error">
              <p><strong>Terjadi kesalahan:</strong></p>
              <pre>${error.message || "Unknown error"}</pre>
            </div>
            <p><a href="/api/ceph-test">Kembali ke halaman utama</a></p>
          </div>
        </body>
      </html>`,
      {
        headers: {
          "Content-Type": "text/html",
        },
        status: 500,
      }
    );
  }
}
