import path from 'node:path';

export function mapHostPathToContainer(hostPath: string): string {
  const hostUserProfile = process.env.HOST_USER_PROFILE;
  const containerMountPoint = '/host-user';

  if (!hostUserProfile || !hostPath) {
    return hostPath;
  }

  const normalizedHostProfile = hostUserProfile.replace(/\\/g, '/').toLowerCase();
  const normalizedPath = hostPath.replace(/\\/g, '/');

  if (normalizedPath.toLowerCase().startsWith(normalizedHostProfile)) {
    const trailingPath = normalizedPath.slice(normalizedHostProfile.length);
    return path.posix.join(containerMountPoint, trailingPath);
  }

  return hostPath;
}


export function mapContainerPathToHost(containerPath: string): string {
  const hostUserProfile = process.env.HOST_USER_PROFILE;
  const containerMountPoint = '/host-user';

  if (!hostUserProfile || !containerPath.startsWith(containerMountPoint)) {
    return containerPath;
  }

  const trailingPath = containerPath.slice(containerMountPoint.length);
  const separator = hostUserProfile.includes('\\') ? '\\' : '/';

  const result = hostUserProfile + trailingPath.split('/').join(separator);

  return result.replace(/\\\\/g, '\\').replace(/\/\//g, '/');
}
