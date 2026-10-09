package expo.modules.tarkaandroid

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import androidx.core.content.ContextCompat
import expo.modules.kotlin.services.FilePermissionService
import java.io.File
import java.util.EnumSet

// File access for projects in Documents/TARKA (used by TarkaAndroidModule).

internal fun projectsFolder() =
  File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "TARKA")

internal fun hasFilesAccess(context: Context) =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    Environment.isExternalStorageManager()
  } else {
    ContextCompat.checkSelfPermission(context, android.Manifest.permission.WRITE_EXTERNAL_STORAGE) ==
      PackageManager.PERMISSION_GRANTED
  }

// expo-file-system only writes outside the app's own folders to paths that already exist (it asks
// File.canWrite(), which is false for a file not created yet). With file access granted,
// everything under Documents/TARKA is TARKA's to read and write, new files included.
internal class TarkaFilePermissions(private val context: Context) : FilePermissionService() {
  override fun getExternalPathPermissions(path: String): EnumSet<Permission> {
    val root = projectsFolder().canonicalPath
    val target = runCatching { File(path).canonicalPath }.getOrNull()
    val inside = target != null && (target == root || target.startsWith("$root/"))
    if (inside && hasFilesAccess(context)) return EnumSet.of(Permission.READ, Permission.WRITE)
    return super.getExternalPathPermissions(path)
  }
}
