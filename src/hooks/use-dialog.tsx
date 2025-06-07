"use client"

import * as React from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

export interface DialogOptions {
	title?: string
	children?: React.ReactNode
	size?: "sm" | "md" | "lg" | "xl"
	className?: string
	showCloseButton?: boolean
	onClose?: () => void
}

interface DialogState {
	id: string
	isOpen: boolean
	options: DialogOptions
}

interface DialogContextType {
	dialogs: DialogState[]
	openDialog: (options: DialogOptions) => string
	closeDialog: (id: string) => void
	closeAll: () => void
}

const DialogContext = React.createContext<DialogContextType | null>(null)

let dialogCounter = 0

export function DialogProvider({ children }: { children: React.ReactNode }) {
	const [dialogs, setDialogs] = React.useState<DialogState[]>([])

	const openDialog = React.useCallback((options: DialogOptions): string => {
		const id = `dialog-${++dialogCounter}`
		const newDialog: DialogState = {
			id,
			isOpen: true,
			options,
		}
		setDialogs((prev) => [...prev, newDialog])
		return id
	}, [])

	const closeDialog = React.useCallback((id: string) => {
		setDialogs((prev) => prev.filter((dialog) => dialog.id !== id))
	}, [])

	const closeAll = React.useCallback(() => {
		setDialogs([])
	}, [])

	const contextValue = React.useMemo(
		() => ({
			dialogs,
			openDialog,
			closeDialog,
			closeAll,
		}),
		[dialogs, openDialog, closeDialog, closeAll]
	)

	return (
		<DialogContext.Provider value={contextValue}>
			{children}
			{dialogs.map((dialog) => (
				<DialogModal
					key={dialog.id}
					id={dialog.id}
					isOpen={dialog.isOpen}
					options={dialog.options}
					onClose={() => {
						dialog.options.onClose?.()
						closeDialog(dialog.id)
					}}
				/>
			))}
		</DialogContext.Provider>
	)
}

interface DialogModalProps {
	id: string
	isOpen: boolean
	options: DialogOptions
	onClose: () => void
}

function DialogModal({ isOpen, options, onClose }: DialogModalProps) {
	const getSizeClass = (size: DialogOptions["size"]) => {
		switch (size) {
			case "sm":
				return "sm:max-w-sm"
			case "md":
				return "sm:max-w-md"
			case "lg":
				return "sm:max-w-lg"
			case "xl":
				return "sm:max-w-xl"
			default:
				return "sm:max-w-lg"
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={`${getSizeClass(options.size)} ${
					options.className || ""
				}`}
				showCloseButton={options.showCloseButton ?? true}
			>
				{options.title && (
					<DialogHeader>
						<DialogTitle>{options.title}</DialogTitle>
						<DialogDescription></DialogDescription>
					</DialogHeader>
				)}
				{options.children}
			</DialogContent>
		</Dialog>
	)
}

export function useDialog() {
	const context = React.useContext(DialogContext)
	if (!context) {
		throw new Error("useDialog must be used within a DialogProvider")
	}

	const openModal = React.useCallback(
		(options: DialogOptions) => {
			return context.openDialog(options)
		},
		[context]
	)

	const close = React.useCallback(
		(id: string) => {
			context.closeDialog(id)
		},
		[context]
	)

	const closeAll = React.useCallback(() => {
		context.closeAll()
	}, [context])

	return React.useMemo(
		() => ({
			open: openModal,
			close,
			closeAll,
		}),
		[openModal, close, closeAll]
	)
}
