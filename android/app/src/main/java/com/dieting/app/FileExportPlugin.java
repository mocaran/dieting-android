package com.dieting.app;

import android.app.Activity;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType(call.getString("type", "text/plain"))
            .putExtra(Intent.EXTRA_TITLE, call.getString("name"));
        startActivityForResult(call, intent, "writeFile");
    }

    @ActivityCallback
    private void writeFile(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        JSObject response = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            response.put("saved", false);
            call.resolve(response);
            return;
        }

        try (OutputStream output = getContext().getContentResolver().openOutputStream(data.getData())) {
            if (output == null) throw new IOException("Document stream unavailable");
            output.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
        } catch (IOException | SecurityException error) {
            call.reject("无法写入导出文件", error);
            return;
        }

        response.put("saved", true);
        call.resolve(response);
    }
}
