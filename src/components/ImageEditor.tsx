import React, { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Rect, Text as KonvaText, Transformer, Group } from 'react-konva';

interface ImageEditorProps {
    imageUrl: string;
    contextText?: string; // dodatni kontekst o vizualu (title/caption/hashtags...)
}

type EditorObject = {
	id: string;
	kind: 'text' | 'rect' | 'image';
	x: number;
	y: number;
	width?: number;
	height?: number;
	text?: string;
	fontSize?: number;
	fill: string;
	opacity: number;
	visible: boolean;
	locked?: boolean;
	src?: string; // for image objects
};

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, contextText }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<any>(null);
	const trRef = useRef<any>(null);
	const bgRef = useRef<any>(null);

	const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
	const [bgSrc, setBgSrc] = useState<string>('');
	const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

	const [objects, setObjects] = useState<EditorObject[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selectedObject = useMemo(() => objects.find(o => o.id === selectedId) || null, [objects, selectedId]);
	const [settingsOpen, setSettingsOpen] = useState(true);
	const [layersOpen, setLayersOpen] = useState(true);
	const [showImagePanel, setShowImagePanel] = useState(false);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [smartOpen, setSmartOpen] = useState(true);
	const [isTitleGenerating, setIsTitleGenerating] = useState(false);
	const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

	const [imgFilters, setImgFilters] = useState({ grayscale: false, sepia: false, invert: false, brightness: 0 });
	const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [deleteAnchor, setDeleteAnchor] = useState<{ top: number; left: number } | null>(null);



	// Load proxied image
	useEffect(() => {
		let isCancelled = false;
		(async () => {
			try {
				const resp = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
				if (!resp.ok) throw new Error('Proxy image failed');
				const { imageSrc } = await resp.json();
				if (!isCancelled) setBgSrc(imageSrc);
			} catch (e) {
				console.error('Failed to proxy image', e);
			}
		})();
		return () => {
			isCancelled = true;
		};
	}, [imageUrl]);

	// Decode image element
	useEffect(() => {
		if (!bgSrc) return;
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => setBgImage(img);
		img.src = bgSrc;
	}, [bgSrc]);

	// Observe container size
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			setContainerSize({ width: el.clientWidth, height: el.clientHeight });
		});
		ro.observe(el);
		setContainerSize({ width: el.clientWidth, height: el.clientHeight });
		return () => ro.disconnect();
	}, []);

	// Compute background placement to fit
	const bgLayout = useMemo(() => {
		if (!bgImage) return { x: 0, y: 0, width: 0, height: 0, scale: 1 };
		const scale = Math.min(containerSize.width / bgImage.width, containerSize.height / bgImage.height);
		const width = bgImage.width * scale;
		const height = bgImage.height * scale;
		const x = (containerSize.width - width) / 2;
		const y = (containerSize.height - height) / 2;
		return { x, y, width, height, scale };
	}, [bgImage, containerSize.width, containerSize.height]);

	// Anchors for floating image settings; computed after bgLayout exists
	const settingsAnchor = useMemo(() => {
		const defaultPos = { top: 12, left: 12 };
		if (!bgLayout.width || !bgLayout.height) return defaultPos;
		const top = Math.max(12, bgLayout.y + 12);
		const left = Math.max(12, bgLayout.x + bgLayout.width - 40);
		return { top, left };
	}, [bgLayout.x, bgLayout.y, bgLayout.width, bgLayout.height]);

	const panelAnchor = useMemo(() => {
		return { top: settingsAnchor.top + 36, left: Math.max(12, settingsAnchor.left - 260) };
	}, [settingsAnchor.top, settingsAnchor.left]);

	// Apply image filters
	const konvaFilters = useMemo(() => {
		const arr: any[] = [];
		if (imgFilters.grayscale) arr.push(Konva.Filters.Grayscale);
		if (imgFilters.sepia) arr.push(Konva.Filters.Sepia);
		if (imgFilters.invert) arr.push(Konva.Filters.Invert);
		if (imgFilters.brightness !== 0) arr.push(Konva.Filters.Brighten);
		return arr;
	}, [imgFilters]);

	useEffect(() => {
		if (bgRef.current) {
			if (konvaFilters.length > 0) bgRef.current.cache(); else bgRef.current.clearCache();
			bgRef.current.getLayer()?.batchDraw();
		}
	}, [konvaFilters, imgFilters.brightness]);

	// Load images for image objects
	useEffect(() => {
		objects.forEach(obj => {
			if (obj.kind !== 'image' || !obj.src) return;
			if (imageElements[obj.id]) return;
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				setImageElements(prev => ({ ...prev, [obj.id]: img }));
			};
			img.src = obj.src;
		});
	}, [objects, imageElements]);

	// Attach transformer to selected node
	useEffect(() => {
		if (!trRef.current || !stageRef.current) return;
		if (!selectedId) {
			trRef.current.nodes([]);
			trRef.current.getLayer()?.batchDraw();
			return;
		}
		const node = stageRef.current.findOne(`#node_${selectedId}`);
		if (node) {
			// Keep ratio for images and text; free for rectangles
			const keep = selectedObject?.kind === 'image' || selectedObject?.kind === 'text';
			trRef.current.setAttrs({
				keepRatio: keep,
				enabledAnchors: keep
					? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
					: undefined,
			});
			trRef.current.nodes([node]);
			trRef.current.getLayer()?.batchDraw();
		}
	}, [selectedId, objects, selectedObject]);

	const addText = () => {
		if (!bgLayout.width || !bgLayout.height) return;
		const id = `text_${Date.now()}`;
		setObjects(prev => [
			...prev,
			{
				id,
				kind: 'text',
				x: bgLayout.x + bgLayout.width / 2,
				y: bgLayout.y + bgLayout.height / 2,
				text: 'Upiši tekst ovde',
				fontSize: 28,
				fill: '#ffffff',
				opacity: 1,
				visible: true,
				locked: false,
			},
		]);
		setSelectedId(id);
	};

	const addRect = () => {
		if (!bgLayout.width || !bgLayout.height) return;
		const id = `rect_${Date.now()}`;
		setObjects(prev => [
			...prev,
			{
				id,
				kind: 'rect',
				x: bgLayout.x + bgLayout.width / 2 - 150,
				y: bgLayout.y + bgLayout.height / 2 - 75,
				width: 300,
				height: 150,
				fill: 'rgba(245,110,54,0.7)',
				opacity: 0.9,
				visible: true,
				locked: false,
			},
		]);
		setSelectedId(id);
	};

	const addImageFromSrc = (src: string) => {
		if (!bgLayout.width || !bgLayout.height) return;
		const id = `image_${Date.now()}`;
		const width = Math.min(240, bgLayout.width * 0.4);
		const height = width; // provisional square until real image loads
		setObjects(prev => [
			...prev,
			{
				id,
				kind: 'image',
				x: bgLayout.x + bgLayout.width / 2 - width / 2,
				y: bgLayout.y + bgLayout.height / 2 - height / 2,
				width,
				height,
				fill: '#ffffff',
				opacity: 1,
				visible: true,
				locked: false,
				src,
			},
		]);
		setSelectedId(id);
	};

	const onPickImage = () => fileInputRef.current?.click();
	const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') addImageFromSrc(reader.result);
		};
		reader.readAsDataURL(f);
		e.target.value = '';
	};

	const updateObject = (id: string, patch: Partial<EditorObject>) => {
		setObjects(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
	};

	// Reorder by drag indexes
	const reorderByIndexes = (from: number, to: number) => {
		if (from === to) return;
		setObjects(prev => {
			const arr = [...prev];
			const [item] = arr.splice(from, 1);
			arr.splice(to, 0, item);
			return arr;
		});
	};

	const toggleVisibility = (id: string) => {
		setObjects(prev => prev.map(o => (o.id === id ? { ...o, visible: !o.visible } : o)));
	};
	const toggleLock = (id: string) => {
		setObjects(prev => prev.map(o => (o.id === id ? { ...o, locked: !o.locked } : o)));
	};
	const duplicateObject = (id: string) => {
		const src = objects.find(o => o.id === id);
		if (!src) return;
		const copy: EditorObject = { ...src, id: `${src.kind}_${Date.now()}`, x: src.x + 20, y: src.y + 20 };
		setObjects(prev => [...prev, copy]);
		setSelectedId(copy.id);
	};
	const deleteSelected = () => {
		if (!selectedId) return;
		setObjects(prev => prev.filter(o => o.id !== selectedId));
		setSelectedId(null);
	};

	// Thumbnail helper
	const LayerThumb: React.FC<{ obj: EditorObject }> = ({ obj }) => {
		if (obj.kind === 'rect') {
			return (
				<div
					className="w-9 h-9 rounded-md border border-white/15 overflow-hidden"
					style={{ background: obj.fill, opacity: obj.opacity }}
				/>
			);
		}
		const textPreview = (obj.text || 'T').slice(0, 1).toUpperCase();
		return (
			<div className="w-9 h-9 rounded-md border border-white/15 overflow-hidden flex items-center justify-center bg-black/40">
				<span style={{ color: obj.fill }} className="text-xs font-bold">
					{textPreview}
				</span>
			</div>
		);
	};

	// Inline text edit on dblclick
	const startInlineEdit = (objId: string) => {
		const stage = stageRef.current;
		if (!stage) return;
		const group = stage.findOne(`#node_${objId}`);
		if (!group) return;
		const textNode = group.findOne('Text');
		if (!textNode) return;
		const abs = textNode.getAbsolutePosition();
		const bbox = stage.container().getBoundingClientRect();
		const ta = document.createElement('textarea');
		ta.value = (objects.find(o => o.id === objId)?.text) || '';
		ta.style.position = 'absolute';
		ta.style.zIndex = '1000';
		ta.style.left = `${bbox.left + abs.x}px`;
		ta.style.top = `${bbox.top + abs.y - (textNode.fontSize?.() || 28)/1.2}px`;
		ta.style.fontSize = `${textNode.fontSize?.() || 28}px`;
		ta.style.padding = '2px 4px';
		ta.style.border = '1px solid rgba(255,255,255,0.3)';
		ta.style.background = 'rgba(0,0,0,0.6)';
		ta.style.color = '#fff';
		ta.style.outline = 'none';
		ta.style.resize = 'none';
		ta.style.fontFamily = 'inherit';
		ta.style.lineHeight = '1.2';
		document.body.appendChild(ta);
		ta.focus();
		const finish = (commit: boolean) => {
			if (commit) updateObject(objId, { text: ta.value });
			document.body.removeChild(ta);
		};
		ta.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') { e.preventDefault(); finish(true); }
			if (e.key === 'Escape') { e.preventDefault(); finish(false); }
		});
		ta.addEventListener('blur', () => finish(true));
	};

	// Compute floating delete anchor above selected element
	useEffect(() => {
		if (!selectedId || !stageRef.current) { setDeleteAnchor(null); return; }
		const stage = stageRef.current;
		const node = stage.findOne(`#node_${selectedId}`);
		if (!node) { setDeleteAnchor(null); return; }
		const box = node.getClientRect();
		const top = Math.max(0, box.y - 40);
		const left = Math.max(0, box.x + box.width - 18);
		setDeleteAnchor({ top, left });
	}, [selectedId, objects, containerSize]);

	const onDownload = () => {
		const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
		if (!uri) return;
		const a = document.createElement('a');
		a.href = uri;
		a.download = 'masterbot-edit.png';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const addTextWithContent = (content: string) => {
		if (!bgLayout.width || !bgLayout.height) return;
		const id = `text_${Date.now()}`;
		const x = bgLayout.x + bgLayout.width / 2;
		const y = bgLayout.y + 40; // near top
		setObjects(prev => [
			...prev,
			{
				id,
				kind: 'text',
				x,
				y,
				text: content,
				fontSize: 36,
				fill: '#ffffff',
				opacity: 1,
				visible: true,
				locked: false,
			},
		]);
		setSelectedId(id);
	};

    const generateTitles = async () => {
		if (!imageUrl) return;
    setIsTitleGenerating(true);
    setTitleSuggestions([]);
		try {
            const systemPrompt = 'Ti si kreativni copywriter za društvene mreže. Pišeš kratke, udarne naslove na srpskom jeziku (3–6 reči), bez emotikona, bez navodnika.';
            const trimmed = (contextText || '').slice(0, 800);
            const userPrompt = `Napravi 5 različitih, modernih i moćnih naslova koji bi se uklopili uz sledeći vizual/kontekst. Ako kontekst postoji, moraš tematski da ga ispoštuješ.\n\nKontekst: ${trimmed || 'nema dodatog konteksta'}\n\nVrati isključivo JSON: { "titles": ["..."] }`;
			const resp = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: 'gpt-4o',
					response_format: { type: 'json_object' },
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt },
					],
				}),
			});
			const data = await resp.json();
			let titles: string[] = [];
			try {
				const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
				titles = Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [];
			} catch {}
			if (titles.length === 0) {
				const raw = (data.choices?.[0]?.message?.content || '').split('\n').filter(Boolean).slice(0, 5);
				titles = raw;
			}
			setTitleSuggestions(titles);
		} catch (e) {
			console.error('Generisanje naslova nije uspelo:', e);
		} finally {
			setIsTitleGenerating(false);
		}
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6 h-full w-full">
			{/* Left controls - Smart + Alatke */}
			<div className="p-4 bg-black/30 rounded-lg flex flex-col space-y-4 w-full lg:w-80 border border-white/10">
				{/* Smart tools accordion */}
				<div className="">
					<button onClick={()=>setSmartOpen(o=>!o)} className="w-full flex items-center justify-between text-white/90 font-semibold mb-2">
						<span>Masterbot pametne alatke</span>
						<span>{smartOpen ? '▾' : '▸'}</span>
					</button>
                    {smartOpen && (
                        <div className="space-y-3 bg-white/5 rounded-md p-3">
                            <button
                                onClick={generateTitles}
                                disabled={isTitleGenerating}
                                className={`w-full text-white font-bold py-2.5 px-3 rounded-lg shadow-lg transition-all ${isTitleGenerating ? 'bg-white/10 cursor-not-allowed' : 'bg-gradient-to-r from-[#F56E36] via-[#d15a2c] to-[#b54a24] hover:opacity-95'} `}
                            >
                                {isTitleGenerating ? 'Generišem naslov…' : 'Generiši naslov'}
                            </button>
                            {titleSuggestions.length > 0 && (
                                <div className="space-y-2 pt-1 max-h-44 overflow-auto">
                                    {titleSuggestions.map((t, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <button
                                                onClick={() => addTextWithContent(t)}
                                                className="shrink-0 px-2.5 py-1.5 text-xs rounded bg-[#4c58b6] text-white hover:opacity-90"
                                            >
                                                Dodaj tekst
                                            </button>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(t)}
                                                className="shrink-0 px-2.5 py-1.5 text-xs rounded bg-black/40 text-white hover:bg-black/60"
                                            >
                                                Copy
                                            </button>
                                            <div className="flex-1 text-white/90 text-sm truncate" title={t}>{t}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
				</div>

				{/* Image settings moved to floating button on canvas */}

				<div className="flex items-center justify-between">
					<h3 className="text-lg font-bold text-white">Alatke</h3>
				</div>
				<button onClick={addText} className="w-full text-white font-bold py-2 px-4 rounded-lg transition-all bg-gradient-to-br from-[#5a67d8] to-[#4c58b6] hover:from-[#4c58b6] hover:to-[#5a67d8] shadow-lg">Dodaj Tekst</button>
				<button onClick={addRect} className="w-full text-white font-bold py-2 px-4 rounded-lg transition-all bg-gradient-to-br from-[#38a169] to-[#2f855a] hover:from-[#2f855a] hover:to-[#38a169] shadow-lg">Dodaj Oblik</button>
				<button onClick={onPickImage} className="w-full text-white font-bold py-2 px-4 rounded-lg transition-all bg-gradient-to-br from-[#F56E36] to-[#d15a2c] hover:from-[#d15a2c] hover:to-[#F56E36] shadow-lg">Dodaj Sliku</button>
				<input ref={fileInputRef} type="file" accept="image/*" onChange={onFilePicked} className="hidden" />


				<div className="flex-grow"></div>
				<button onClick={onDownload} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all bg-gradient-to-br from-[#F56E36] to-[#d15a2c] hover:from-[#d15a2c] hover:to-[#F56E36] shadow-lg">Preuzmi Sliku</button>
			</div>

			{/* Canvas */}
			<div ref={containerRef} className="group relative flex-grow bg-black/20 rounded-lg overflow-hidden border border-white/10">
				<Stage
					ref={stageRef}
					width={containerSize.width}
					height={containerSize.height}
					onMouseDown={(e) => {
						// deselect when clicked on empty area
						const clickedOnEmpty = e.target === e.target.getStage();
						if (clickedOnEmpty) setSelectedId(null);
					}}
				>
					<Layer listening={false}>
						{bgImage && (
							<KonvaImage
								ref={bgRef}
								image={bgImage}
								x={bgLayout.x}
								y={bgLayout.y}
								width={bgLayout.width}
								height={bgLayout.height}
								filters={konvaFilters}
								brightness={imgFilters.brightness}
							/>
						)}
					</Layer>
					<Layer>
						{objects.map(obj => (
							<Group
								key={obj.id}
								id={`node_${obj.id}`}
								x={obj.x}
								y={obj.y}
								visible={obj.visible}
								draggable={!obj.locked}
								onClick={() => setSelectedId(obj.id)}
								onTap={() => setSelectedId(obj.id)}
								onDblClick={() => obj.kind==='text' && startInlineEdit(obj.id)}
								onDblTap={() => obj.kind==='text' && startInlineEdit(obj.id)}
								onDragEnd={(e) => updateObject(obj.id, { x: e.target.x(), y: e.target.y() })}
							>
								{obj.kind === 'rect' ? (
									<Rect
										width={obj.width || 200}
										height={obj.height || 100}
										fill={obj.fill}
										opacity={obj.opacity}
									/>
								) : obj.kind === 'text' ? (
									<KonvaText
										text={obj.text || ''}
										fontSize={obj.fontSize || 28}
										fontStyle="bold"
										fill={obj.fill}
										opacity={obj.opacity}
									/>
								) : (
									<KonvaImage
										image={imageElements[obj.id]}
										width={obj.width || 200}
										height={obj.height || 200}
										opacity={obj.opacity}
									/>
								)}
							</Group>
						))}
						<Transformer ref={trRef} rotateEnabled={false} />
					</Layer>
				</Stage>

				{/* Floating image settings trigger */}
				<button
					onClick={() => setShowImagePanel(s => !s)}
					className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white rounded-md px-3 py-2 border border-white/10 shadow-lg"
					style={{ top: `${settingsAnchor.top}px`, left: `${settingsAnchor.left}px` }}
					title="Podešavanja slike"
				>
					🎚
				</button>

				{/* Floating image settings panel */}
				{showImagePanel && (
					<div className="absolute w-72 bg-editor-gradient border border-white/10 rounded-xl p-4 shadow-2xl"
						style={{ top: `${panelAnchor.top}px`, left: `${panelAnchor.left}px` }}
					>
						<div className="flex items-center justify-between mb-2">
							<h4 className="text-white font-semibold">Podešavanja slike</h4>
							<button className="text-white/70 hover:text-white" onClick={()=>setShowImagePanel(false)}>✕</button>
						</div>
						<div className="space-y-3">
							<label className="flex items-center gap-2 text-white/90 text-sm"><input type="checkbox" checked={imgFilters.grayscale} onChange={(e)=>setImgFilters(f=>({...f,grayscale:e.target.checked}))}/> Crno-bela</label>
							<label className="flex items-center gap-2 text-white/90 text-sm"><input type="checkbox" checked={imgFilters.sepia} onChange={(e)=>setImgFilters(f=>({...f,sepia:e.target.checked}))}/> Sepia</label>
							<label className="flex items-center gap-2 text-white/90 text-sm"><input type="checkbox" checked={imgFilters.invert} onChange={(e)=>setImgFilters(f=>({...f,invert:e.target.checked}))}/> Invert</label>
							<div>
								<label className="text-sm font-semibold text-white/80 block mb-1">Osvetljenje</label>
								<input type="range" min="-0.5" max="0.5" step="0.05" value={imgFilters.brightness} onChange={(e)=>setImgFilters(f=>({...f,brightness: parseFloat(e.target.value)}))} className="w-full"/>
							</div>
						</div>
					</div>
				)}

				{/* Floating delete for selected node */}
				{deleteAnchor && (
					<button
						onClick={deleteSelected}
						className="absolute bg-[#7a1c1c] hover:bg-[#a32323] text-white rounded-md px-2 py-1 shadow-lg border border-white/10"
						style={{ top: `${deleteAnchor.top}px`, left: `${deleteAnchor.left}px` }}
						title="Obriši"
					>
						🗑
					</button>
				)}
			</div>

			{/* Right controls - Layers + Settings */}
			<div className="p-4 bg-black/30 rounded-lg flex flex-col space-y-4 w-full lg:w-80 border border-white/10">
				{/* Layers accordion */}
				<div className={`pt-1 ${objects.length === 0 ? 'opacity-0 pointer-events-none select-none' : ''}` }>
					<button onClick={()=>setLayersOpen(o=>!o)} className="w-full flex items-center justify-between text-white/90 font-semibold mb-2">
						<span>Slojevi (prevuci za redosled)</span>
						<span>{layersOpen ? '▾' : '▸'}</span>
					</button>
					{layersOpen && (
						<div className="space-y-2 max-h-64 overflow-auto pr-1">
							{objects.map((o, idx) => (
								<div
									key={o.id}
									draggable
									onDragStart={() => setDragIndex(idx)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={() => { if (dragIndex!==null){ reorderByIndexes(dragIndex, idx); setDragIndex(null);} }}
									className={`flex items-center justify-between gap-2 text-white text-sm px-2 py-1 rounded border ${selectedId===o.id ? 'border-[#F56E36] bg-[#F56E36]/20 shadow-[0_0_10px_rgba(245,110,54,0.4)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
								>
									<LayerThumb obj={o} />
									<button onClick={() => setSelectedId(o.id)} className="flex-1 text-left truncate">
										{idx+1}. {o.kind === 'text' ? 'Tekst' : o.kind === 'rect' ? 'Oblik' : 'Slika'}
									</button>
									<div className="flex items-center gap-1">
										<button onClick={() => toggleVisibility(o.id)} title="Vidljivost" className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">{o.visible ? '👁' : '🚫'}</button>
										<button onClick={() => toggleLock(o.id)} title="Zaključaj" className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">{o.locked ? '🔒' : '🔓'}</button>
										<button onClick={() => duplicateObject(o.id)} title="Dupliraj" className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">⎘</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Settings accordion */}
				<div className={`pt-3 border-t border-white/10 ${objects.length === 0 ? 'opacity-0 pointer-events-none select-none' : ''}` }>
					<div className="w-full flex items-center justify-between text-white/90 font-semibold mb-2">
						<button onClick={()=>setSettingsOpen(o=>!o)} className="flex-1 text-left">Podešavanja</button>
						{selectedObject && (
							<button onClick={deleteSelected} title="Obriši selektovano" className="ml-2 px-2 py-1 bg-[#7a1c1c] hover:bg-[#a32323] text-white rounded">🗑</button>
						)}
					</div>
					{settingsOpen && selectedObject && (
						<div className="space-y-4">
							{selectedObject.kind === 'text' && (
								<div>
									<label className="text-sm font-semibold text-white/80 block mb-2">Tekst</label>
									<input
										type="text"
										value={selectedObject.text || ''}
										onChange={(e) => updateObject(selectedObject.id, { text: e.target.value })}
										className="w-full bg-black/20 border border-white/15 rounded-md p-2 text-white"
									/>
									<label className="text-sm font-semibold text-white/80 block mt-3 mb-2">Veličina fonta</label>
									<input type="range" min="12" max="96" step="1" value={selectedObject.fontSize || 28} onChange={(e)=>updateObject(selectedObject.id,{fontSize: parseInt(e.target.value)})} className="w-full" />
								</div>
							)}
							{selectedObject.kind === 'rect' && (
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-sm font-semibold text-white/80 block mb-2">Širina</label>
										<input type="range" min="50" max="800" step="10" value={selectedObject.width || 200} onChange={(e)=>updateObject(selectedObject.id,{width: parseInt(e.target.value)})} className="w-full" />
									</div>
									<div>
										<label className="text-sm font-semibold text-white/80 block mb-2">Visina</label>
										<input type="range" min="30" max="600" step="10" value={selectedObject.height || 100} onChange={(e)=>updateObject(selectedObject.id,{height: parseInt(e.target.value)})} className="w-full" />
									</div>
								</div>
							)}
							{selectedObject.kind !== 'image' && (
								<div>
									<label className="text-sm font-semibold text-white/80 block mb-2">Boja</label>
									<input
										type="color"
										value={selectedObject.fill}
										onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
										className="w-full h-10 p-1 bg-black/20 border border-white/15 rounded-md"
									/>
								</div>
							)}
							<div>
								<label className="text-sm font-semibold text-white/80 block mb-2">Providnost</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.05"
									value={selectedObject.opacity}
									onChange={(e) => updateObject(selectedObject.id, { opacity: parseFloat(e.target.value) })}
									className="w-full"
								/>
							</div>
						</div>
					)}
				</div>
			</div>

		</div>
	);
};

const copyTitle = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
};

export default ImageEditor;
