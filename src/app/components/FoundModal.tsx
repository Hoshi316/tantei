'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface FoundModalProps {
  open: boolean
  onClose: () => void
  onSave: (location: string, memo: string) => void
}

export default function FoundModal({ open, onClose, onSave }: FoundModalProps) {
  const [location, setLocation] = useState("")
  const [memo, setMemo] = useState("")

  const handleSave = () => {
    onSave(location, memo)
    setLocation("")
    setMemo("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>見つけた場所を記録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="どこで見つけた？（例：机の上）"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Textarea
            placeholder="どうして見つかった？何があった？"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
