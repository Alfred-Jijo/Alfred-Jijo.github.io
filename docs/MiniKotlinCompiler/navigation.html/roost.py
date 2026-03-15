import argparse
import os
import shutil
import subprocess
from pathlib import Path


class DotfilesManager:
    def __init__(self, repo_url=None, dotfiles_dir="~/.dotfiles", backup_dir="~/.dotfiles_backup"):
        self.repo_url = repo_url
        self.dotfiles_dir = Path(dotfiles_dir).expanduser()
        self.backup_dir = Path(backup_dir).expanduser()

    def clone_repo(self):
        if not self.repo_url:
            raise ValueError("No repository URL specified")
        if self.dotfiles_dir.exists():
            print(f"[clone] Dotfiles directory {self.dotfiles_dir} already exists, skipping clone")
            return
        self.dotfiles_dir.parent.mkdir(parents=True, exist_ok=True)
        print(f"[clone] Cloning {self.repo_url} into {self.dotfiles_dir}")
        subprocess.check_call(["git", "clone", self.repo_url, str(self.dotfiles_dir)])

    def _backup(self, target: Path):
        if not target.exists() and not target.is_symlink():
            return
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        rel = target.relative_to(Path.home())
        backup_path = self.backup_dir / rel
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        if backup_path.exists():
            print(f"[backup] {backup_path} already exists, overwriting")
        print(f"[backup] Moving {target} -> {backup_path}")
        # Use replace to handle existing backups
        shutil.move(str(target), str(backup_path))

    def _link_one(self, src: Path, dest: Path, force: bool, backup: bool):
        if dest.is_symlink():
            current = dest.resolve()
            if current == src.resolve():
                print(f"[link] OK (already linked): {dest} -> {src}")
                return
            else:
                print(f"[link] Replacing existing symlink {dest} -> {current}")
                dest.unlink()

        elif dest.exists():
            if backup:
                self._backup(dest)
            elif force:
                print(f"[link] Removing existing {dest}")
                if dest.is_dir():
                    shutil.rmtree(dest)
                else:
                    dest.unlink()
            else:
                print(f"[link] Skipping {dest}, exists and no --force/--backup")
                return

        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"[link] {dest} -> {src}")
        dest.symlink_to(src)

    def link_all(self, force=False, backup=True, subdir="home"):
        """
        Assumes dotfiles repo is structured like $DOTFILES/home mirroring $HOME.
        Everything under $DOTFILES/home will be symlinked into $HOME.
        """
        home = Path.home()
        root = self.dotfiles_dir / subdir
        if not root.exists():
            raise RuntimeError(f"{root} does not exist; expected repo layout: {self.dotfiles_dir}/{subdir}")

        for path in root.rglob("*"):
            if path.is_dir():
                continue
            rel = path.relative_to(root)
            dest = home / rel
            self._link_one(src=path, dest=dest, force=force, backup=backup)

    def unlink_all(self, subdir="home"):
        """
        Removes symlinks previously created, without touching real files.
        """
        home = Path.home()
        root = self.dotfiles_dir / subdir
        if not root.exists():
            raise RuntimeError(f"{root} does not exist; expected repo layout: {self.dotfiles_dir}/{subdir}")

        for path in root.rglob("*"):
            if path.is_dir():
                continue
            rel = path.relative_to(root)
            dest = home / rel
            if dest.is_symlink():
                print(f"[unlink] Removing symlink {dest}")
                dest.unlink()
            else:
                print(f"[unlink] Skipping {dest}, not a symlink")


def parse_args():
    p = argparse.ArgumentParser(description="Simple dotfiles clone/link manager in Python.")
    sub = p.add_subparsers(dest="cmd", required=True)

    # common options
    def add_common(o):
        o.add_argument("--dotfiles-dir", default="~/.dotfiles", help="Local dotfiles directory")
        o.add_argument("--backup-dir", default="~/.dotfiles_backup", help="Backup directory for existing files")

    # clone
    p_clone = sub.add_parser("clone", help="Clone dotfiles repository")
    p_clone.add_argument("repo", help="Git URL to clone")
    add_common(p_clone)

    # link
    p_link = sub.add_parser("link", help="Create symlinks into $HOME from dotfiles repo")
    add_common(p_link)
    p_link.add_argument("--no-backup", action="store_true", help="Do not backup existing files")
    p_link.add_argument("--force", action="store_true", help="Force overwrite existing files")
    p_link.add_argument("--subdir", default="home", help="Subdirectory inside repo that mirrors $HOME")

    # unlink
    p_unlink = sub.add_parser("unlink", help="Remove symlinks previously created")
    add_common(p_unlink)
    p_unlink.add_argument("--subdir", default="home", help="Subdirectory inside repo that mirrors $HOME")

    return p.parse_args()


def main():
    args = parse_args()

    if args.cmd == "clone":
        mgr = DotfilesManager(repo_url=args.repo,
                              dotfiles_dir=args.dotfiles_dir,
                              backup_dir=args.backup_dir)
        mgr.clone_repo()

    elif args.cmd == "link":
        mgr = DotfilesManager(dotfiles_dir=args.dotfiles_dir,
                              backup_dir=args.backup_dir)
        mgr.link_all(force=args.force, backup=not args.no_backup, subdir=args.subdir)

    elif args.cmd == "unlink":
        mgr = DotfilesManager(dotfiles_dir=args.dotfiles_dir,
                              backup_dir=args.backup_dir)
        mgr.unlink_all(subdir=args.subdir)


if __name__ == "__main__":
    main()
