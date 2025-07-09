"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";

export function AvisoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    sonnerToast(
      <div className="flex items-center gap-2">
        <span>Aviso importante disponível.</span>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Ver aviso
        </Button>
      </div>
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <div className="w-full flex items-center justify-center">
          <p className="text-lg text-center">
            Lorem ipsum dolor sit amet sed lorem nonumy accumsan zzril et est takimata aliquyam ipsum. Tempor eirmod stet rebum justo. Ipsum vulputate dolore lorem suscipit rebum. Justo sadipscing vero et et sed dolor vulputate eum elitr amet vero nonumy sadipscing no et lorem. No accusam stet erat et elitr magna lorem vel lobortis dolor ea zzril esse dolores accusam ut diam luptatum. Invidunt eos no iusto dolor sed dolores ipsum eu labore et eos gubergren no praesent eum. Kasd diam gubergren ut sed nam lorem dolores sadipscing. Sed ex no nostrud et ea sea dolore et nonummy sadipscing lorem. Ea vel eum vel dolores sit duo. Sit amet duo magna magna magna nonummy sea sed labore lorem dolor ea et sed. Erat diam sed eirmod consectetuer dolor. Rebum sadipscing labore dolores illum. Et et ipsum aliquyam aliquyam dignissim vero dolor justo sed ipsum dolor sanctus sit sit amet lorem. Adipiscing tempor nobis dolor magna liber.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 