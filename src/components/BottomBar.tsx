"use client";

export default function BottomBar() {
  return (
    <footer className="px-6 py-3 border-t border-zkeleton-border bg-zkeleton-panel/80 backdrop-blur-sm">
      <p className="text-center text-[11px] tracking-wide">
        <span className="text-gray-500">
          Claims data = what was billed.
        </span>
        {"  "}
        <span className="text-gray-500">
          Clinical data = what actually happened.
        </span>
        {"  "}
        <span className="text-zkeleton-teal font-medium">
          The gap is where the money hides.
        </span>
        {"  "}
        <span className="text-gray-600">
          Everyone else grades book reports. Zkeleton gives you the book.
        </span>
      </p>
    </footer>
  );
}
