package com.fptrades.portal;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastExitAttemptAt = 0L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (view, windowInsets) -> {
            Insets statusBar = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
            view.setPadding(0, statusBar.top, 0, 0);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(getBridge().getWebView());

        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        getBridge().getWebView().setRendererPriorityPolicy(
            android.webkit.WebView.RENDERER_PRIORITY_IMPORTANT,
            false
        );
    }

    @Override
    public void finish() {
        long now = System.currentTimeMillis();
        if (now - lastExitAttemptAt > 2000L) {
            lastExitAttemptAt = now;
            Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show();
            return;
        }
        super.finish();
    }
}
