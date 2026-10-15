/** Print an isolated, already-rendered label without the application navigation. */
export function printElement(element: HTMLElement, title: string): void {
   const frame = document.createElement("iframe");
   frame.title = title;
   frame.setAttribute("aria-hidden", "true");
   frame.style.cssText = "position:fixed;width:0;height:0;border:0;bottom:0;left:0";
   document.body.appendChild(frame);
   const doc = frame.contentDocument;
   const target = frame.contentWindow;
   if (!doc || !target) { frame.remove(); throw new Error("No se pudo preparar la impresión."); }
   doc.title = title;
   const style = doc.createElement("style");
   style.textContent = "@page{size:A4;margin:15mm}body{margin:0;font:12pt Arial,sans-serif;color:#17324d;background:white}body>div{width:70mm;padding:8mm;text-align:center;border:1px solid #ccd5de;box-sizing:border-box;break-inside:avoid}svg{display:block;width:50mm;height:50mm;margin:0 auto 5mm}p{overflow-wrap:anywhere;margin:3mm 0}p:first-of-type{font-weight:bold}button{display:none}";
   doc.head.appendChild(style);
   doc.body.appendChild(element.cloneNode(true));
   let cleanupTimer: ReturnType<typeof setTimeout>;
   const cleanup = () => { clearTimeout(cleanupTimer); frame.remove(); };
   target.addEventListener("afterprint", cleanup, { once: true });
   cleanupTimer = setTimeout(cleanup, 300000);
   requestAnimationFrame(() => { target.focus(); target.print(); });
}
