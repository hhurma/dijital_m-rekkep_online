// Basit capitalize fonksiyonu
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
import { useRef, useState } from 'react'
import { Editor, useEditor, useValue } from 'tldraw'

type TLShapeId = string

function ShapeItem({
	shapeId,
	depth,
	parentIsSelected,
	parentIsHidden,
}: {
	shapeId: TLShapeId
	depth: number
	parentIsSelected?: boolean
	parentIsHidden?: boolean
}) {
	const editor = useEditor()

	const shape = useValue('shape', () => editor.getShape(shapeId), [editor])
	const children = useValue('children', () => editor.getSortedChildIdsForParent(shapeId), [editor])
	const isHidden = useValue('isHidden', () => editor.isShapeHidden(shapeId), [editor])
	const isSelected = useValue('isSelected', () => editor.getSelectedShapeIds().includes(shapeId), [
		editor,
	])
	const shapeName = useValue('shapeName', () => getShapeName(editor, shapeId), [editor])

	const [isEditingName, setIsEditingName] = useState(false)

	const timeSinceLastVisibilityToggle = useRef(Date.now())

	if (!shape) return null

	return (
		<>
			{!!shape && (
				<div
					className="shape-item"
					onDoubleClick={() => {
						setIsEditingName(true)
					}}
					onClick={() => {
						// We synchronize the selection state of the layer panel items with the selection state of the shapes in the editor.
						if (editor.inputs.ctrlKey || editor.inputs.shiftKey) {
							if (isSelected) {
								editor.deselect(shape)
							} else {
								editor.select(...editor.getSelectedShapes(), shape)
							}
						} else {
							editor.select(shape)
						}
					}}
					style={{
						paddingLeft: 10 + depth * 20,
						opacity: isHidden ? 0.5 : 1,
						background: isSelected
							? '#E8F4FE'
							: parentIsSelected
								? '#F3F9FE'
								: depth > 0
									? '#00000006'
									: undefined,
					}}
				>
					{isEditingName ? (
						<input
							autoFocus
							className="shape-name-input"
							defaultValue={shapeName}
							onBlur={() => setIsEditingName(false)}
							onChange={(ev) => {
								if (shape.type === 'frame') {
									editor.updateShape({ ...shape, props: { name: ev.target.value } })
								} else {
									editor.updateShape({ ...shape, meta: { name: ev.target.value } })
								}
							}}
							onKeyDown={(ev) => {
								// finish editing on enter
								if (ev.key === 'Enter' || ev.key === 'Escape') {
									ev.currentTarget.blur()
								}
							}}
						/>
					) : (
						<div className="shape-name">{shapeName}</div>
					)}
					<button
						className="shape-visibility-toggle"
						onClick={(ev) => {
							const now = Date.now()
							if (now - timeSinceLastVisibilityToggle.current < 200) {
								editor.updateShape({
									...shape,
									meta: { hidden: false, force_show: true },
								})
								timeSinceLastVisibilityToggle.current = 0
							} else {
								editor.updateShape({
									...shape,
									meta: { hidden: !shape.meta.hidden, force_show: false },
								})
								timeSinceLastVisibilityToggle.current = now
							}
							ev.preventDefault()
							ev.stopPropagation()
						}}
						onDoubleClickCapture={(ev) => {
							ev.stopPropagation()
						}}
					>
						{shape.meta.hidden ? <VisibilityOff /> : <VisibilityOn />}
					</button>
				</div>
			)}
			{!!children?.length && (
				<ShapeList
					shapeIds={children}
					depth={depth + 1}
					parentIsHidden={parentIsHidden || isHidden}
					parentIsSelected={parentIsSelected || isSelected}
				/>
			)}
		</>
	)
}

export function ShapeList({
	shapeIds,
	depth,
	parentIsSelected,
	parentIsHidden,
}: {
	shapeIds: TLShapeId[]
	depth: number
	parentIsSelected?: boolean
	parentIsHidden?: boolean
}) {
	if (!shapeIds.length) return null
	return (
		<div className="shape-tree">
			{shapeIds.map((shapeId) => (
				<ShapeItem
					key={shapeId}
					shapeId={shapeId}
					depth={depth}
					parentIsHidden={parentIsHidden}
					parentIsSelected={parentIsSelected}
				/>
			))}
		</div>
	)
}

function getShapeName(editor: Editor, shapeId: TLShapeId) {
	const shape = editor.getShape(shapeId)
	if (!shape) return 'Bilinmeyen şekil'
	return (
		// meta.name is the first choice, then the shape's text, then the capitalized shape type
		(shape.meta.name as string) ||
		editor.getShapeUtil(shape).getText(shape) ||
		capitalize(shape.type + ' şekli')
	)
}

// Basit ikon komponentleri
function VisibilityOn() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
			<circle cx="12" cy="12" r="3"/>
		</svg>
	)
}

function VisibilityOff() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
			<line x1="1" y1="1" x2="23" y2="23"/>
		</svg>
	)
}
