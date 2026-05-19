"import { useState } from \"react\";
import { api, imgUrl } from \"@/lib/api\";
import { Upload, X } from \"lucide-react\";
import { toast } from \"sonner\";

export default function ImageUploader({ value = [], onChange, max = 4 }) {
  const [busy, setBusy] = useState(false);

  const upload = async (files) => {
    if (!files || !files.length) return;
    setBusy(true);
    const next = [...value];
    for (const file of files) {
      if (next.length >= max) break;
      const fd = new FormData();
      fd.append(\"file\", file);
      try {
        const { data } = await api.post(\"/upload\", fd, { headers: { \"Content-Type\": \"multipart/form-data\" } });
        next.push(data.url);
      } catch {
        toast.error(\"Upload failed\");
      }
    }
    onChange(next);
    setBusy(false);
  };

  return (
    <div data-testid=\"image-uploader\">
      <div className=\"grid grid-cols-3 sm:grid-cols-4 gap-3\">
        {value.map((u, i) => (
          <div key={u} className=\"relative aspect-square rounded-lg overflow-hidden border border-[#E7E5E4]\">
            <img src={imgUrl(u)} alt=\"\" className=\"w-full h-full object-cover\" />
            <button data-testid={`remove-img-${i}`} type=\"button\" onClick={() => onChange(value.filter((x) => x !== u))}
              className=\"absolute top-1 right-1 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow\">
              <X className=\"w-3 h-3\" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <label className=\"aspect-square rounded-lg border-2 border-dashed border-[#E7E5E4] flex flex-col items-center justify-center text-xs text-[#57534E] hover:border-[#2D6A4F] cursor-pointer\">
            <Upload className=\"w-5 h-5 mb-1\" />
            {busy ? \"Uploading…\" : \"Upload\"}
            <input data-testid=\"image-uploader-input\" type=\"file\" accept=\"image/*\" multiple className=\"hidden\"
              onChange={(e) => upload(Array.from(e.target.files || []))} />
          </label>
        )}
      </div>
    </div>
  );
}
"